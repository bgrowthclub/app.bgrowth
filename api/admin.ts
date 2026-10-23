import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { createHash, randomUUID } from 'node:crypto'

// BGrowth Website — Administration endpoint (members, licenses, trials,
// manual access grants). One Serverless Function routed by ?resource=
// (Vercel Hobby's 12-function limit), same pattern as Studio's
// api/access-management.js — whose grant rules (duplicate protection,
// revoke-never-delete) are mirrored here exactly.
//
// Unlike Studio's Phase 1 endpoint, every request is authenticated: the
// caller's Supabase access token (Bearer) must belong to a row in
// portal.website_admins, checked with the service role on every request.
//
// Self-contained (no relative imports) for the same reason as
// api/studio-checkout.ts. Server-only env: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, and STRIPE_SECRET_KEY for ?resource=sales.

// Sending a newsletter can take a while (batches of 100).
export const maxDuration = 60

type AdminRole = 'admin' | 'support'
type Admin = { id: string; email: string; role: AdminRole }
type Db = SupabaseClient<any, 'portal', any>

const PAGE_SIZE = 25
// What the site sells one by one (and in bundles): Studio Workspaces and,
// since Sprint 78, Studio calculators.
const SELLABLE_TYPES = ['workspace', 'calculator', 'pdf']

class HttpError extends Error {
  constructor(public status: number, message: string, public extra?: Record<string, unknown>) {
    super(message)
  }
}

function client(): Db {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new HttpError(500, 'Administration isn’t configured on this site yet.')
  return createClient(url, key, {
    db: { schema: 'portal' },
    auth: { persistSession: false, autoRefreshToken: false },
  }) as Db
}

async function requireAdmin(req: VercelRequest, db: Db): Promise<Admin> {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new HttpError(401, 'Sign in to continue.')
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Sign in to continue.')
  // '*': the role column only exists with Portal migration 0042 (before
  // that, every administrator is a full admin).
  const { data: row, error: rowError } = await db
    .from('website_admins')
    .select('*')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (rowError) throw rowError
  if (!row) throw new HttpError(403, 'This area is for BGrowth administrators.')
  const role: AdminRole = (row as { role?: string }).role === 'support' ? 'support' : 'admin'
  return { id: data.user.id, email: data.user.email ?? '', role }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function futureDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) throw new HttpError(400, `${field} is not a valid date.`)
  if (parsed.getTime() <= Date.now()) throw new HttpError(400, `${field} must be in the future.`)
  return parsed.toISOString()
}

// ---------------------------------------------------------------------------
// Grant rules — identical to Studio's api/_lib/accessGrants.js
// ---------------------------------------------------------------------------
interface GrantRow {
  scope: 'specific' | 'all'
  product_id: string | null
  expires_at: string | null
  revoked_at: string | null
}

function isGrantActive(grant: GrantRow) {
  if (grant.revoked_at !== null) return false
  return grant.expires_at === null || new Date(grant.expires_at).getTime() > Date.now()
}

function checkForDuplicateGrant(existing: GrantRow[], scope: 'specific' | 'all', productId: string | null) {
  const active = existing.filter(isGrantActive)
  const all = active.find((g) => g.scope === 'all')
  if (scope === 'all') {
    return all ? { ok: false as const, message: 'This member already has an active All Workspaces grant.' } : { ok: true as const }
  }
  if (active.some((g) => g.scope === 'specific' && g.product_id === productId)) {
    return { ok: false as const, message: 'This member already has an active grant for this Workspace.' }
  }
  if (all) {
    return {
      ok: true as const,
      warning:
        'This member already has access to every Workspace through an All Workspaces grant. Add this one anyway if it should outlast a future revoke of the global grant.',
    }
  }
  return { ok: true as const }
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
async function authInfo(db: Db, userId: string) {
  const { data } = await db.auth.admin.getUserById(userId)
  const user = data?.user
  return {
    lastSignInAt: user?.last_sign_in_at ?? null,
    emailConfirmedAt: user?.email_confirmed_at ?? null,
    email: user?.email ?? null,
  }
}

async function listMembers(req: VercelRequest, db: Db) {
  const q = str(req.query.q).replace(/[,()*%\\]/g, ' ').trim()
  const page = Math.max(1, Number.parseInt(str(req.query.page), 10) || 1)
  const from = (page - 1) * PAGE_SIZE

  let query = db.from('users').select('id, email, full_name, has_used_trial, created_at', { count: 'exact' })
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
  const { data: users, count, error } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1)
  if (error) throw error

  const ids = (users ?? []).map((u) => u.id as string)
  const [licenses, grants, auth] = await Promise.all([
    ids.length ? db.from('licenses').select('user_id, type, status, access_policy, expires_at').in('user_id', ids) : { data: [], error: null },
    ids.length ? db.from('access_grants').select('user_id, scope, product_id, expires_at, revoked_at').in('user_id', ids) : { data: [], error: null },
    Promise.all(ids.map((id) => authInfo(db, id))),
  ])
  if (licenses.error) throw licenses.error
  if (grants.error) throw grants.error

  const now = Date.now()
  const members = (users ?? []).map((u, i) => {
    const own = (licenses.data ?? []).filter((l) => l.user_id === u.id)
    const live = own.filter(
      (l) => l.status === 'active' && (l.access_policy === 'lifetime' || l.expires_at === null || new Date(l.expires_at).getTime() > now),
    )
    return {
      id: u.id,
      email: auth[i].email ?? u.email,
      fullName: u.full_name,
      createdAt: u.created_at,
      lastSignInAt: auth[i].lastSignInAt,
      emailConfirmed: Boolean(auth[i].emailConfirmedAt),
      hasUsedTrial: u.has_used_trial,
      purchases: live.filter((l) => l.type !== 'trial').length,
      trialActive: live.some((l) => l.type === 'trial'),
      activeGrants: (grants.data ?? []).filter((g) => g.user_id === u.id && isGrantActive(g as GrantRow)).length,
    }
  })
  return { members, total: count ?? members.length, page, pageSize: PAGE_SIZE }
}

async function getMember(req: VercelRequest, db: Db) {
  const id = str(req.query.id)
  if (!id) throw new HttpError(400, 'id is required.')
  const { data: user, error } = await db.from('users').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!user) throw new HttpError(404, 'Member not found.')

  const [auth, licenses, grants, instances] = await Promise.all([
    authInfo(db, id),
    db.from('licenses').select('*, products(id, name, slug)').eq('user_id', id).order('created_at', { ascending: false }),
    db.from('access_grants').select('*, products(id, name, slug)').eq('user_id', id).order('created_at', { ascending: false }),
    db.from('workspace_instances').select('product_id').eq('user_id', id),
  ])
  if (licenses.error) throw licenses.error
  if (grants.error) throw grants.error
  if (instances.error) throw instances.error

  const documents: Record<string, number> = {}
  for (const row of instances.data ?? []) documents[row.product_id] = (documents[row.product_id] ?? 0) + 1

  return {
    member: {
      id: user.id,
      email: auth.email ?? user.email,
      fullName: user.full_name,
      createdAt: user.created_at,
      lastSignInAt: auth.lastSignInAt,
      emailConfirmed: Boolean(auth.emailConfirmedAt),
      hasUsedTrial: user.has_used_trial,
    },
    licenses: licenses.data ?? [],
    grants: grants.data ?? [],
    documents,
  }
}

async function listProducts(db: Db) {
  const { data, error } = await db
    .from('products')
    .select('id, name, slug, is_free, price_cents, currency, status, last_published_at')
    .eq('status', 'published')
    // Workspaces and calculators — a bundle (0041) isn't something to give
    // access to.
    .in('content_type', SELLABLE_TYPES)
    .order('name')
  if (error) throw error
  return { products: data ?? [] }
}

// ---------------------------------------------------------------------------
// Grants
// ---------------------------------------------------------------------------
async function createGrant(req: VercelRequest, db: Db, admin: Admin) {
  const userId = str(req.body?.userId)
  const scope = req.body?.scope
  const productId = str(req.body?.productId) || null
  const note = str(req.body?.note) || null
  if (!userId) throw new HttpError(400, 'userId is required.')
  if (scope !== 'all' && scope !== 'specific') throw new HttpError(400, "scope must be 'all' or 'specific'.")
  if (scope === 'specific' && !productId) throw new HttpError(400, 'Choose a Workspace.')
  const expiresAt = futureDate(req.body?.expiresAt, 'The end date')

  const { data: existing, error } = await db.from('access_grants').select('*').eq('user_id', userId)
  if (error) throw error
  const check = checkForDuplicateGrant((existing ?? []) as GrantRow[], scope, scope === 'specific' ? productId : null)
  if (!check.ok) throw new HttpError(409, check.message)
  if ('warning' in check && check.warning && req.body?.confirmWarning !== true) {
    return { requiresConfirmation: true, warning: check.warning }
  }

  const { data, error: insertError } = await db
    .from('access_grants')
    .insert({
      user_id: userId,
      scope,
      product_id: scope === 'specific' ? productId : null,
      expires_at: expiresAt,
      note,
      granted_by: admin.email || 'BGrowth Website admin',
    })
    .select('*, products(id, name, slug)')
    .single()
  if (insertError) throw insertError
  return { grant: data }
}

async function revokeGrant(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  if (!id) throw new HttpError(400, 'id is required.')
  // .is('revoked_at', null): a double click can never overwrite the
  // original revoked_at.
  const { data, error } = await db
    .from('access_grants')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .is('revoked_at', null)
    .select('*, products(id, name, slug)')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(409, 'This grant is already revoked.')
  return { grant: data }
}

// ---------------------------------------------------------------------------
// Licenses (purchases and trials)
// ---------------------------------------------------------------------------
async function giveLicense(req: VercelRequest, db: Db) {
  const userId = str(req.body?.userId)
  const productId = str(req.body?.productId)
  if (!userId || !productId) throw new HttpError(400, 'userId and productId are required.')
  // The same write path as a real purchase (Stripe webhook / free claim):
  // upgrades an existing trial in place, never creates a duplicate.
  const { data, error } = await db.rpc('grant_purchased_license', { p_user_id: userId, p_product_id: productId })
  if (error) throw error
  return { license: data }
}

async function updateLicense(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  const action = req.body?.action
  if (!id) throw new HttpError(400, 'id is required.')

  const { data: license, error } = await db.from('licenses').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!license) throw new HttpError(404, 'License not found.')

  let patch: Record<string, unknown>
  if (action === 'extend') {
    if (license.access_policy === 'lifetime') throw new HttpError(409, 'This license never expires.')
    const expiresAt = futureDate(req.body?.expiresAt, 'The new end date')
    if (!expiresAt) throw new HttpError(400, 'Choose the new end date.')
    patch = { expires_at: expiresAt, status: 'active' }
  } else if (action === 'end') {
    if (license.status === 'revoked') throw new HttpError(409, 'This license is already ended.')
    patch = { status: 'revoked' }
  } else if (action === 'restore') {
    if (license.status !== 'revoked') throw new HttpError(409, 'This license isn’t ended.')
    patch = { status: 'active' }
  } else {
    throw new HttpError(400, "action must be 'extend', 'end' or 'restore'.")
  }

  const { data, error: updateError } = await db
    .from('licenses')
    .update(patch)
    .eq('id', id)
    .select('*, products(id, name, slug)')
    .single()
  if (updateError) throw updateError
  return { license: data }
}

// ---------------------------------------------------------------------------
// Confirmation e-mail — resend Supabase's sign-up confirmation to a member
// who never confirmed (same e-mail and template as at sign-up).
// ---------------------------------------------------------------------------
function siteOrigin(req: VercelRequest): string {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  const proto = req.headers['x-forwarded-proto'] ?? 'https'
  return `${Array.isArray(proto) ? proto[0] : proto}://${Array.isArray(host) ? host[0] : host}`
}

async function resendConfirmation(req: VercelRequest, db: Db) {
  const userId = str(req.body?.userId)
  if (!userId) throw new HttpError(400, 'userId is required.')
  const { data, error } = await db.auth.admin.getUserById(userId)
  if (error || !data.user?.email) throw new HttpError(404, 'Member not found.')
  if (data.user.email_confirmed_at) throw new HttpError(409, 'This member has already confirmed their e-mail.')
  const { error: resendError } = await db.auth.resend({
    type: 'signup',
    email: data.user.email,
    options: { emailRedirectTo: `${siteOrigin(req)}/verify-email` },
  })
  if (resendError) throw new HttpError(429, resendError.message)
  return { sentTo: data.user.email }
}

// ---------------------------------------------------------------------------
// Sales — read straight from Stripe, the source of truth for payments. The
// Website and the Portal sell through the same account, so this lists both
// (a Website session carries metadata.source = 'website'). Free claims and
// trials never touch Stripe; they live on licenses (see members).
// ---------------------------------------------------------------------------
const SALES_MONTHS = 12
const SALES_MAX = 2000

interface SaleRow {
  id: string
  createdAt: string
  amount: number
  currency: string
  refunded: number | null
  email: string | null
  userId: string | null
  productSlug: string | null
  productName: string | null
  source: 'website' | 'portal'
  // Opens the payment in the Stripe Dashboard.
  stripeUrl: string | null
}

function refundedOf(session: Stripe.Checkout.Session): number | null {
  const pi = session.payment_intent
  if (!pi || typeof pi === 'string') return null
  const charge = pi.latest_charge
  if (!charge || typeof charge === 'string') return null
  return charge.amount_refunded
}

async function listSales(db: Db) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new HttpError(500, 'Stripe isn’t configured on this site yet.')
  const stripe = new Stripe(key)

  const since = new Date()
  since.setUTCDate(1)
  since.setUTCHours(0, 0, 0, 0)
  since.setUTCMonth(since.getUTCMonth() - (SALES_MONTHS - 1))
  const params: Stripe.Checkout.SessionListParams = {
    status: 'complete',
    created: { gte: Math.floor(since.getTime() / 1000) },
    limit: 100,
  }

  // Refund status needs PaymentIntents/Charges read access; a key limited to
  // Checkout Sessions still lists the sales, just without refunds.
  let refundsAvailable = true
  let sessions: Stripe.Checkout.Session[]
  try {
    sessions = await stripe.checkout.sessions
      .list({ ...params, expand: ['data.payment_intent.latest_charge'] })
      .autoPagingToArray({ limit: SALES_MAX })
  } catch (err) {
    if (!(err instanceof Stripe.errors.StripePermissionError)) throw err
    refundsAvailable = false
    sessions = await stripe.checkout.sessions.list(params).autoPagingToArray({ limit: SALES_MAX })
  }

  const paid = sessions.filter((s) => s.payment_status === 'paid' && (s.amount_total ?? 0) > 0)
  const slugs = Array.from(new Set(paid.map((s) => s.metadata?.productSlug).filter((v): v is string => Boolean(v))))
  const names: Record<string, string> = {}
  if (slugs.length) {
    const { data, error } = await db.from('products').select('slug, name').in('slug', slugs)
    if (error) throw error
    for (const row of data ?? []) names[row.slug] = row.name
  }

  const sales: SaleRow[] = paid.map((s) => {
    const slug = s.metadata?.productSlug ?? null
    return {
      id: s.id,
      createdAt: new Date(s.created * 1000).toISOString(),
      amount: s.amount_total ?? 0,
      currency: s.currency ?? 'usd',
      refunded: refundsAvailable ? refundedOf(s) ?? 0 : null,
      email: s.customer_details?.email ?? s.customer_email ?? null,
      userId: s.metadata?.userId ?? s.client_reference_id ?? null,
      productSlug: slug,
      productName: slug ? names[slug] ?? slug : null,
      source: s.metadata?.source === 'website' ? 'website' : 'portal',
      stripeUrl: (() => {
        const pi = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id
        return pi ? `https://dashboard.stripe.com/${s.livemode ? '' : 'test/'}payments/${pi}` : null
      })(),
    }
  })

  return { sales, since: since.toISOString(), months: SALES_MONTHS, refundsAvailable, truncated: sessions.length >= SALES_MAX }
}

// ---------------------------------------------------------------------------
// Support Center — the team side (members talk through api/support.ts).
// Hours logic and e-mail are duplicated from there on purpose: functions
// stay self-contained.
// ---------------------------------------------------------------------------
interface SupportHours {
  timezone: string
  days: number[]
  start: string
  end: string
}

const DEFAULT_HOURS: SupportHours = { timezone: 'America/Los_Angeles', days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function isOnline(hours: SupportHours, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: hours.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const day = WEEKDAYS.indexOf(get('weekday'))
  const minutes = Number(get('hour')) * 60 + Number(get('minute'))
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  return hours.days.includes(day) && minutes >= toMin(hours.start) && minutes < toMin(hours.end)
}

async function loadHours(db: Db): Promise<SupportHours> {
  const { data } = await db.from('site_settings').select('value').eq('key', 'support_hours').maybeSingle()
  return { ...DEFAULT_HOURS, ...((data?.value as Partial<SupportHours>) ?? {}) }
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

async function emailMember(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const from = process.env.SUPPORT_FROM_EMAIL || 'BGrowth Support <support@bgrowth.app>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, reply_to: 'support@bgrowth.app' }),
    })
    if (!res.ok) console.error('[admin] support e-mail failed:', res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error('[admin] support e-mail failed:', err)
    return false
  }
}

// Which of these members have a live plan with priority support
// (membership_plans.entitlements.prioritySupport — Portal migration 0057).
async function priorityMembers(db: Db, userIds: string[]): Promise<Set<string>> {
  if (!userIds.length) return new Set()
  const { data, error } = await db
    .from('member_plans')
    .select('user_id, status, starts_at, ends_at, membership_plans(entitlements)')
    .in('user_id', userIds)
  if (error) return new Set()
  const out = new Set<string>()
  for (const r of (data ?? []) as Record<string, any>[]) {
    if (r.membership_plans?.entitlements?.prioritySupport && isLivePlan(r as any)) out.add(r.user_id)
  }
  return out
}

async function listSupport(req: VercelRequest, db: Db) {
  const status = str(req.query.status) === 'closed' ? 'closed' : 'open'
  const hours = await loadHours(db)
  const { data, error } = await db
    .from('support_conversations')
    .select('id, user_id, subject, status, last_sender, last_message_at, created_at, users(email, full_name)')
    .eq('status', status)
    .order('last_message_at', { ascending: false })
    .limit(200)
  if (error) throw error
  // Members whose plan includes priority support (Sprint 125).
  const priorityUsers = await priorityMembers(db, [...new Set((data ?? []).map((c) => c.user_id as string))])
  // Priority members waiting first, then anyone waiting, then the most recent.
  const score = (c: { last_sender: string; user_id: string }) =>
    (c.last_sender === 'customer' ? 2 : 0) + (priorityUsers.has(c.user_id) ? 1 : 0)
  const conversations = (data ?? [])
    .map((c) => ({ ...c, priority: priorityUsers.has(c.user_id as string) }))
    .sort((a, b) => score(b) - score(a))
  const { count } = await db
    .from('support_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('last_sender', 'customer')
  return { hours, online: isOnline(hours), conversations, waiting: count ?? 0 }
}

// The sidebar badge: open conversations waiting for the team.
async function countSupportWaiting(db: Db) {
  const { count, error } = await db
    .from('support_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('last_sender', 'customer')
  if (error) throw error
  // Also the account deletions waiting for the team (sidebar badge). Zero
  // until Portal migration 0039 exists.
  const deletions = await db
    .from('account_deletion_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  return { waiting: count ?? 0, deletionsPending: deletions.error ? 0 : (deletions.count ?? 0) }
}

async function getSupportThread(req: VercelRequest, db: Db) {
  const id = str(req.query.id)
  const { data: conversation, error } = await db
    .from('support_conversations')
    .select('id, user_id, subject, status, last_sender, last_message_at, customer_read_at, created_at, users(email, full_name)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!conversation) throw new HttpError(404, 'Conversation not found.')
  const { data: messages, error: msgError } = await db
    .from('support_messages')
    .select('id, sender, author_name, body, created_at')
    .eq('conversation_id', id)
    .order('created_at')
  if (msgError) throw msgError
  return { conversation, messages: messages ?? [] }
}

async function replySupport(req: VercelRequest, db: Db, admin: Admin) {
  const id = str(req.body?.conversationId)
  const body = str(req.body?.body)
  if (!body) throw new HttpError(400, 'Write your reply.')
  if (body.length > 5000) throw new HttpError(400, 'The reply is too long (5,000 characters max).')
  const { data: conversation, error } = await db
    .from('support_conversations')
    .select('id, subject, customer_read_at, users(email, full_name)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!conversation) throw new HttpError(404, 'Conversation not found.')

  const now = new Date()
  const { error: msgError } = await db
    .from('support_messages')
    .insert({ conversation_id: id, sender: 'staff', author_id: admin.id, author_name: 'BGrowth Support', body })
  if (msgError) throw msgError
  await db
    .from('support_conversations')
    .update({ last_sender: 'staff', last_message_at: now.toISOString(), status: 'open' })
    .eq('id', id)

  // E-mail the member unless they are in the chat right now (opened it in
  // the last 3 minutes during support hours).
  const hours = await loadHours(db)
  const watching = isOnline(hours) && now.getTime() - new Date(conversation.customer_read_at).getTime() < 3 * 60_000
  const member = conversation.users as unknown as { email: string; full_name: string | null } | null
  let emailed = false
  if (!watching && member?.email) {
    const first = member.full_name?.split(' ')[0] || 'there'
    emailed = await emailMember(
      member.email,
      `Re: ${conversation.subject}`,
      `<p>Hi ${escapeHtml(first)},</p>
       <p>BGrowth Support replied to your message:</p>
       <blockquote style="border-left:3px solid #1061EC;margin:0;padding:4px 12px;color:#0A1B4D">${escapeHtml(body).replace(/\n/g, '<br>')}</blockquote>
       <p><a href="${siteOrigin(req)}/platform/support?c=${id}">Open the conversation</a> to reply.</p>
       <p style="color:#6b7280">— BGrowth Support</p>`,
    )
  }
  return { emailed }
}

async function setSupportStatus(req: VercelRequest, db: Db) {
  const id = str(req.body?.conversationId)
  const status = req.body?.status
  if (status !== 'open' && status !== 'closed') throw new HttpError(400, "status must be 'open' or 'closed'.")
  const { error } = await db.from('support_conversations').update({ status }).eq('id', id)
  if (error) throw error
  return {}
}

async function saveSupportHours(req: VercelRequest, db: Db, admin: Admin) {
  const timezone = str(req.body?.timezone)
  const start = str(req.body?.start)
  const end = str(req.body?.end)
  const days = Array.isArray(req.body?.days) ? (req.body.days as unknown[]).map(Number).filter((d) => d >= 0 && d <= 6) : []
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
  } catch {
    throw new HttpError(400, 'Unknown time zone.')
  }
  if (!TIME.test(start) || !TIME.test(end) || start >= end) throw new HttpError(400, 'Opening must be before closing (HH:MM).')
  if (days.length === 0) throw new HttpError(400, 'Pick at least one day.')
  const value: SupportHours = { timezone, days: Array.from(new Set(days)).sort(), start, end }
  const { error } = await db
    .from('site_settings')
    .upsert({ key: 'support_hours', value, updated_at: new Date().toISOString(), updated_by: admin.email })
  if (error) throw error
  return { hours: value, online: isOnline(value) }
}

// ---------------------------------------------------------------------------
// Categories — Area → Ramo (Portal migration 0032). Areas are the Growth
// Categories (parent_id null); a Ramo has parent_id = its Area. A product
// keeps one category_id (a Ramo, or an Area for a general Workspace). Studio
// and the Website's catalog filters read this same list.
// ---------------------------------------------------------------------------
type CategoryRow = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
  // How it looks (Portal migration 0047); absent before it runs.
  icon?: string | null
  color?: string | null
  cover_image_url?: string | null
}

// Keys of the Website's icon/color lists (src/components/systems/
// categoryIcons.ts — keep in step).
const CATEGORY_ICONS = new Set(['layers', 'briefcase', 'stamp', 'sparkles', 'calculator', 'truck', 'car', 'home', 'heart', 'graduation', 'languages', 'piggy', 'scale', 'file', 'megaphone', 'shop', 'camera', 'scissors', 'food', 'wrench', 'paw', 'baby', 'fitness', 'building', 'globe'])
const CATEGORY_COLORS = new Set(['blue', 'green', 'teal', 'amber', 'orange', 'red', 'pink', 'purple', 'gray'])

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function loadCategories(db: Db): Promise<CategoryRow[]> {
  const { data, error } = await db
    .from('workspace_categories')
    .select('*')
    .order('sort_order')
    .order('name')
  if (error) throw error
  return (data ?? []) as CategoryRow[]
}

async function listCatalogCategories(db: Db) {
  const categories = await loadCategories(db)
  const { data, error } = await db
    .from('products')
    .select('id, name, slug, status, category_id, cover_image_url')
    .neq('status', 'archived')
    // A bundle's category is set in Admin → Bundles.
    .neq('content_type', 'bundle')
    .order('name')
  if (error) throw error
  return { categories, products: data ?? [] }
}

async function createCategory(req: VercelRequest, db: Db) {
  const name = str(req.body?.name).slice(0, 80)
  const parentId = str(req.body?.parentId) || null
  if (!name) throw new HttpError(400, 'Give the category a name.')
  if (!parentId) throw new HttpError(400, 'Choose the area this category belongs to.')
  const categories = await loadCategories(db)
  const parent = categories.find((c) => c.id === parentId)
  if (!parent || parent.parent_id) throw new HttpError(400, 'Categories can only go inside an area.')
  const slug = slugify(name)
  if (!slug) throw new HttpError(400, 'Use letters or numbers in the name.')
  if (categories.some((c) => c.slug === slug)) throw new HttpError(409, `A category called “${name}” already exists.`)
  const sortOrder = categories.filter((c) => c.parent_id === parentId).length
  const { data, error } = await db
    .from('workspace_categories')
    .insert({ name, slug, parent_id: parentId, sort_order: sortOrder })
    .select('id, name, slug, parent_id, sort_order')
    .single()
  if (error) throw error
  return { category: data }
}

// Rename or move to another area. The slug never changes: Studio and
// published products refer to it.
async function updateCategory(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  const categories = await loadCategories(db)
  const current = categories.find((c) => c.id === id)
  if (!current) throw new HttpError(404, 'Category not found.')
  const patch: Record<string, unknown> = {}
  if (req.body?.name !== undefined) {
    const name = str(req.body.name).slice(0, 80)
    if (!name) throw new HttpError(400, 'Give the category a name.')
    patch.name = name
  }
  if (req.body?.parentId !== undefined) {
    if (!current.parent_id) throw new HttpError(400, 'Areas stay at the top level.')
    const parent = categories.find((c) => c.id === str(req.body.parentId))
    if (!parent || parent.parent_id) throw new HttpError(400, 'Categories can only go inside an area.')
    patch.parent_id = parent.id
  }
  // Its look (Admin → Catalog → Categories; areas too). '' = back to the
  // default.
  if (req.body?.icon !== undefined) {
    const icon = str(req.body.icon)
    if (icon && !CATEGORY_ICONS.has(icon)) throw new HttpError(400, 'Unknown icon.')
    patch.icon = icon || null
  }
  if (req.body?.color !== undefined) {
    const color = str(req.body.color)
    if (color && !CATEGORY_COLORS.has(color)) throw new HttpError(400, 'Unknown color.')
    patch.color = color || null
  }
  if (req.body?.coverImageUrl !== undefined) {
    patch.cover_image_url = cleanUrl(req.body.coverImageUrl, 'The cover image') || null
  }
  if (Object.keys(patch).length === 0) throw new HttpError(400, 'Nothing to change.')
  const { data, error } = await db
    .from('workspace_categories')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return { category: data }
}

async function deleteCategory(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  const categories = await loadCategories(db)
  const current = categories.find((c) => c.id === id)
  if (!current) throw new HttpError(404, 'Category not found.')
  if (!current.parent_id) throw new HttpError(400, 'Areas can’t be deleted.')
  const { count, error } = await db
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
  if (error) throw error
  if ((count ?? 0) > 0) throw new HttpError(409, 'Move the Workspaces in this category to another one first.')
  const { error: delError } = await db.from('workspace_categories').delete().eq('id', id)
  if (delError) throw delError
  return { deleted: id }
}

// Sets a product's category straight away (products + catalog_index), so
// the site's filters change without republishing. Studio reads it back the
// next time the Workspace is opened there.
async function setProductCategory(req: VercelRequest, db: Db) {
  const productId = str(req.body?.productId)
  const categoryId = str(req.body?.categoryId) || null
  if (!productId) throw new HttpError(400, 'Missing product.')
  if (categoryId && !(await loadCategories(db)).some((c) => c.id === categoryId)) {
    throw new HttpError(400, 'Category not found.')
  }
  const { data, error } = await db
    .from('products')
    .update({ category_id: categoryId })
    .eq('id', productId)
    .select('id, category_id')
    .single()
  if (error) throw error
  const { error: indexError } = await db.from('catalog_index').update({ category_id: categoryId }).eq('product_id', productId)
  if (indexError) throw indexError
  return { product: data }
}


// ---------------------------------------------------------------------------
// Newsletter (Portal migration 0036) — the team writes e-mails here and
// sends them to subscribers by area. Visitors subscribe through
// api/newsletter.ts.
// ---------------------------------------------------------------------------
const NEWSLETTER_AREAS = [
  'business-entrepreneurship',
  'careers-professions',
  'languages',
  'personal-finance',
  'productivity',
  'education',
  'health-wellness',
  'family-lifestyle',
]

const AREA_LABELS: Record<string, string> = {
  'business-entrepreneurship': 'Business & Entrepreneurship',
  'careers-professions': 'Careers & Professions',
  languages: 'Languages',
  'personal-finance': 'Personal Finance',
  productivity: 'Productivity',
  education: 'Education',
  'health-wellness': 'Health & Wellness',
  'family-lifestyle': 'Family & Lifestyle',
}

type CampaignRow = {
  id: string
  kind: 'newsletter' | 'launch'
  product_id: string | null
  subject: string
  preheader: string
  body_html: string
  audience_areas: string[]
  status: 'draft' | 'sending' | 'sent'
  sent_count: number
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

function newsletterSiteUrl(req: VercelRequest) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  return `https://${Array.isArray(host) ? host[0] : host}`
}

function escapeHtmlText(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

function cleanAreas(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((v): v is string => typeof v === 'string' && NEWSLETTER_AREAS.includes(v)))]
}

async function loadNewsletterAddress(db: Db): Promise<string> {
  const { data } = await db.from('site_settings').select('value').eq('key', 'newsletter_address').maybeSingle()
  return typeof data?.value === 'string' ? data.value : ''
}

// The editor writes plain HTML; e-mail apps want inline styles.
function inlineEmailStyles(html: string) {
  const styles: Record<string, string> = {
    p: 'margin:0 0 16px;font-size:16px;line-height:1.6;color:#33406B',
    h1: 'margin:24px 0 12px;font-size:26px;line-height:1.25;color:#0A1B4D',
    h2: 'margin:24px 0 10px;font-size:21px;line-height:1.3;color:#0A1B4D',
    h3: 'margin:20px 0 8px;font-size:17px;line-height:1.35;color:#0A1B4D',
    ul: 'margin:0 0 16px;padding-left:22px;color:#33406B',
    ol: 'margin:0 0 16px;padding-left:22px;color:#33406B',
    li: 'margin:0 0 6px;font-size:16px;line-height:1.6',
    a: 'color:#1061EC;font-weight:600',
    img: 'display:block;max-width:100%;height:auto;border-radius:12px;margin:8px 0 16px',
    blockquote: 'margin:0 0 16px;padding:4px 14px;border-left:3px solid #1061EC;color:#33406B',
  }
  let out = html
  for (const [tag, style] of Object.entries(styles)) {
    out = out.replace(new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi'), (match, attrs = '') => {
      if (/\sstyle=/i.test(attrs)) return match
      return `<${tag}${attrs} style="${style}">`
    })
  }
  // Images that aren't wrapped in a block element still need a width cap.
  return out.replace(/<img(?![^>]*\swidth=)/gi, '<img width="560"')
}

function renderCampaignEmail(
  campaign: Pick<CampaignRow, 'subject' | 'preheader' | 'body_html'>,
  site: string,
  address: string,
  token: string | null,
) {
  const prefs = token ? `${site}/newsletter/preferences?token=${token}` : `${site}/newsletter/preferences`
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtmlText(campaign.subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F7FD">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtmlText(campaign.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FD"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px">
<tr><td style="padding:24px 28px 8px;font-family:Inter,Arial,sans-serif">
<a href="${site}" style="text-decoration:none;color:#0A1B4D;font-weight:800;font-size:20px">BGrowth</a>
</td></tr>
<tr><td style="padding:8px 28px 28px;font-family:Inter,Arial,sans-serif">${inlineEmailStyles(campaign.body_html)}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px"><tr><td style="padding:18px 28px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B7896;text-align:center">
You’re receiving this because you subscribed to BGrowth updates.<br>
<a href="${prefs}" style="color:#6B7896">Choose your interests</a> · <a href="${prefs}&action=unsubscribe" style="color:#6B7896">Unsubscribe</a><br>
${escapeHtmlText(address)}
</td></tr></table>
</td></tr></table>
</body></html>`
}

// Wix contacts (Portal migration 0056, Sprint 116): people who were in touch
// with the old Wix site, kept in portal.imported_contacts. They never agreed
// to BGrowth e-mails, so they get ONE invite; only who clicks "Yes, keep me
// posted" joins the newsletter (api/newsletter.ts?resource=invite-accept).
const CONTACT_GROUPS = ['contact', 'team', 'spam']

type ImportedContactRow = {
  id: string
  email: string
  name: string | null
  origin: string | null
  grp: string
  was_member: boolean
  had_free_plan: boolean
  unsubscribed_before: boolean
  external_created_at: string | null
  invite_token: string
  invited_at: string | null
  accepted_at: string | null
}

async function listWixContacts(db: Db) {
  const { data, error } = await db.from('imported_contacts').select('*').order('external_created_at', { ascending: false })
  if (error) {
    if (isMissingTable(error)) return { contacts: [], ready: false, address: '' }
    throw error
  }
  const rows = (data ?? []) as ImportedContactRow[]
  const emails = rows.map((r) => r.email)
  // Joined some other way (signed up, or subscribed on the site) counts too.
  const [subs, users] = emails.length
    ? await Promise.all([
        db.from('newsletter_subscribers').select('email').eq('status', 'subscribed').in('email', emails),
        db.from('users').select('email').in('email', emails),
      ])
    : [{ data: [] }, { data: [] }]
  const subscribed = new Set(((subs.data ?? []) as { email: string }[]).map((r) => r.email.toLowerCase()))
  const members = new Set(((users.data ?? []) as { email: string }[]).map((r) => (r.email ?? '').toLowerCase()))
  return {
    ready: true,
    address: await loadNewsletterAddress(db),
    contacts: rows.map(({ invite_token: _token, ...r }) => ({
      ...r,
      subscribed: subscribed.has(r.email),
      member: members.has(r.email),
    })),
  }
}

async function updateWixContact(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  const grp = str(req.body?.grp)
  if (!CONTACT_GROUPS.includes(grp)) throw new HttpError(400, 'Unknown group.')
  const { data, error } = await db.from('imported_contacts').update({ grp, updated_at: new Date().toISOString() }).eq('id', id).select('email, grp').maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'Contact not found.')
  return { contact: data }
}

function inviteParagraphs(message: string) {
  return message
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#33406B">${escapeHtmlText(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function renderInviteEmail(subject: string, message: string, site: string, address: string, token: string | null) {
  const accept = token ? `${site}/newsletter/confirm?invite=${token}` : `${site}/newsletter/confirm`
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtmlText(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F7FD">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FD"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px">
<tr><td style="padding:24px 28px 8px;font-family:Inter,Arial,sans-serif">
<a href="${site}" style="text-decoration:none;color:#0A1B4D;font-weight:800;font-size:20px">BGrowth</a>
</td></tr>
<tr><td style="padding:8px 28px 8px;font-family:Inter,Arial,sans-serif">${inviteParagraphs(message)}</td></tr>
<tr><td style="padding:0 28px 12px;font-family:Inter,Arial,sans-serif">
<a href="${accept}" style="display:inline-block;background:#1061EC;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:12px">Yes, keep me posted</a>
</td></tr>
<tr><td style="padding:4px 28px 28px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#33406B">
Or <a href="${site}/register" style="color:#1061EC;font-weight:600">create your free BGrowth account</a>.
</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px"><tr><td style="padding:18px 28px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B7896;text-align:center">
You’re receiving this one-time message because you were in touch with us on our previous site (benterprises.biz).<br>
We won’t e-mail you again unless you choose to.<br>
${escapeHtmlText(address)}
</td></tr></table>
</td></tr></table>
</body></html>`
}

function inviteContent(req: VercelRequest) {
  const subject = str(req.body?.subject).slice(0, 150)
  const message = str(req.body?.message).slice(0, 5000)
  if (!subject) throw new HttpError(400, 'Add a subject first.')
  if (!message.trim()) throw new HttpError(400, 'Write the message first.')
  return { subject, message }
}

function inviteMessage(req: VercelRequest, subject: string, message: string, address: string, to: string, token: string | null) {
  return {
    from: process.env.NEWSLETTER_FROM_EMAIL || 'BGrowth <news@bgrowth.app>',
    to,
    subject,
    html: renderInviteEmail(subject, message, newsletterSiteUrl(req), address, token),
  }
}

async function sendWixInviteTest(req: VercelRequest, db: Db, admin: Admin) {
  const { subject, message } = inviteContent(req)
  const address = await loadNewsletterAddress(db)
  if (!address) throw new HttpError(400, 'Add the mailing address (required by US law) in Admin → Newsletter first.')
  await resendBatch([{ ...inviteMessage(req, `[Test] ${subject}`, message, address, admin.email, null) }])
  return { sentTo: admin.email }
}

async function sendWixInvites(req: VercelRequest, db: Db) {
  const { subject, message } = inviteContent(req)
  const address = await loadNewsletterAddress(db)
  if (!address) throw new HttpError(400, 'Add the mailing address (required by US law) in Admin → Newsletter first.')
  const ids = Array.isArray(req.body?.ids) ? (req.body.ids as unknown[]).map(String).slice(0, 500) : []
  if (!ids.length) throw new HttpError(400, 'Tick the contacts to invite.')
  const { data, error } = await db.from('imported_contacts').select('id, email, invite_token').in('id', ids).is('invited_at', null).eq('unsubscribed_before', false)
  if (error) throw error
  const rows = (data ?? []) as Pick<ImportedContactRow, 'id' | 'email' | 'invite_token'>[]
  let sent = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    await resendBatch(chunk.map((r) => inviteMessage(req, subject, message, address, r.email, r.invite_token)))
    const { error: markError } = await db
      .from('imported_contacts')
      .update({ invited_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in('id', chunk.map((r) => r.id))
    if (markError) console.error('[admin] wix invite mark failed:', markError.message)
    sent += chunk.length
  }
  return { sent, skipped: ids.length - sent }
}

async function newsletterOverview(db: Db) {
  const { data: subs, error } = await db.from('newsletter_subscribers').select('status, interests')
  if (error) throw error
  const rows = (subs ?? []) as { status: string; interests: string[] }[]
  const subscribed = rows.filter((r) => r.status === 'subscribed')
  const byArea = Object.fromEntries(
    NEWSLETTER_AREAS.map((area) => [area, subscribed.filter((r) => r.interests.length === 0 || r.interests.includes(area)).length]),
  )
  const { data: campaigns, error: cError } = await db
    .from('newsletter_campaigns')
    .select('id, kind, product_id, subject, status, sent_count, sent_at, audience_areas, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (cError) throw cError
  return {
    stats: {
      subscribed: subscribed.length,
      pending: rows.filter((r) => r.status === 'pending').length,
      unsubscribed: rows.filter((r) => r.status === 'unsubscribed').length,
      allTopics: subscribed.filter((r) => r.interests.length === 0).length,
      byArea,
    },
    areas: NEWSLETTER_AREAS.map((id) => ({ id, label: AREA_LABELS[id] })),
    campaigns: campaigns ?? [],
    address: await loadNewsletterAddress(db),
  }
}

async function loadCampaign(db: Db, id: string): Promise<CampaignRow> {
  if (!id) throw new HttpError(400, 'Missing e-mail.')
  const { data, error } = await db.from('newsletter_campaigns').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'E-mail not found.')
  return data as CampaignRow
}

async function getCampaign(req: VercelRequest, db: Db) {
  return { campaign: await loadCampaign(db, str(req.query.id)) }
}

async function saveCampaign(req: VercelRequest, db: Db, admin: Admin) {
  const id = str(req.body?.id)
  const fields = {
    subject: str(req.body?.subject).slice(0, 200),
    preheader: str(req.body?.preheader).slice(0, 200),
    body_html: typeof req.body?.bodyHtml === 'string' ? req.body.bodyHtml.slice(0, 200_000) : '',
    audience_areas: cleanAreas(req.body?.audienceAreas),
    updated_at: new Date().toISOString(),
  }
  if (id) {
    const current = await loadCampaign(db, id)
    if (current.status !== 'draft') throw new HttpError(409, 'This e-mail was already sent and can’t be changed.')
    const { data, error } = await db.from('newsletter_campaigns').update(fields).eq('id', id).select('*').single()
    if (error) throw error
    return { campaign: data }
  }
  const { data, error } = await db
    .from('newsletter_campaigns')
    .insert({ ...fields, kind: 'newsletter', created_by: admin.email })
    .select('*')
    .single()
  if (error) throw error
  return { campaign: data }
}

async function deleteCampaign(req: VercelRequest, db: Db) {
  const current = await loadCampaign(db, str(req.body?.id))
  if (current.status !== 'draft') throw new HttpError(409, 'Sent e-mails stay in the history.')
  const { error } = await db.from('newsletter_campaigns').delete().eq('id', current.id)
  if (error) throw error
  return { deleted: current.id }
}

// A ready-to-edit announcement for a published Workspace, addressed to the
// people interested in its area.
async function createLaunchCampaign(req: VercelRequest, db: Db, admin: Admin) {
  const productId = str(req.body?.productId)
  const { data: product, error } = await db
    .from('products')
    .select('id, name, slug, short_description, cover_image_url, category_id, status, content_type')
    .eq('id', productId)
    .maybeSingle()
  if (error) throw error
  if (!product || product.status !== 'published' || !SELLABLE_TYPES.includes(product.content_type)) throw new HttpError(404, 'Choose a published Workspace.')
  const categories = await loadCategories(db)
  const category = categories.find((c) => c.id === product.category_id)
  const parent = category?.parent_id ? categories.find((c) => c.id === category.parent_id) : undefined
  const area = parent?.slug ?? category?.slug
  const site = newsletterSiteUrl(req)
  const link = `${site}/product/${product.slug}`
  const name = escapeHtmlText(product.name)
  const body = [
    product.cover_image_url ? `<p><a href="${link}"><img src="${product.cover_image_url}" alt="${name}"></a></p>` : '',
    `<h1>New on BGrowth: ${name}</h1>`,
    `<p>${escapeHtmlText(product.short_description ?? '')}</p>`,
    `<p><a href="${link}">See ${name} →</a></p>`,
  ].join('')
  const { data, error: insError } = await db
    .from('newsletter_campaigns')
    .insert({
      kind: 'launch',
      product_id: product.id,
      subject: `New on BGrowth: ${product.name}`.slice(0, 200),
      preheader: (product.short_description ?? '').slice(0, 200),
      body_html: body,
      audience_areas: area && NEWSLETTER_AREAS.includes(area) ? [area] : [],
      created_by: admin.email,
    })
    .select('*')
    .single()
  if (insError) throw insError
  return { campaign: data }
}

async function uploadNewsletterImage(req: VercelRequest, db: Db) {
  const dataUrl = str(req.body?.dataUrl)
  const match = /^data:(image\/(png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new HttpError(400, 'Use a PNG, JPG, WebP or GIF image.')
  const bytes = Buffer.from(match[3], 'base64')
  if (bytes.length > 3 * 1024 * 1024) throw new HttpError(413, 'This image is too large (3 MB max).')
  const ext = match[2] === 'jpeg' ? 'jpg' : match[2]
  // Also used for bundle covers (Admin → Bundles), member page photos
  // (Admin → Pages) and share images (Admin → Site → SEO).
  const folder = ['bundles', 'pages', 'categories', 'site'].includes(str(req.body?.folder)) ? str(req.body?.folder) : 'newsletter'
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`
  const { error } = await db.storage.from('portal-product-assets').upload(path, bytes, { contentType: match[1], upsert: false })
  if (error) throw error
  const { data } = db.storage.from('portal-product-assets').getPublicUrl(path)
  return { url: data.publicUrl }
}

async function previewCampaign(req: VercelRequest, db: Db) {
  const campaign = {
    subject: str(req.body?.subject),
    preheader: str(req.body?.preheader),
    body_html: typeof req.body?.bodyHtml === 'string' ? req.body.bodyHtml : '',
  }
  return { html: renderCampaignEmail(campaign, newsletterSiteUrl(req), (await loadNewsletterAddress(db)) || '[Mailing address — add it in Admin → Newsletter]', null) }
}

async function audienceFor(db: Db, areas: string[]) {
  const all: { email: string; token: string }[] = []
  for (let from = 0; ; from += 1000) {
    let query = db.from('newsletter_subscribers').select('email, token').eq('status', 'subscribed').order('created_at').range(from, from + 999)
    if (areas.length > 0) query = query.or(`interests.ov.{${areas.join(',')}},interests.eq.{}`)
    const { data, error } = await query
    if (error) throw error
    all.push(...((data ?? []) as { email: string; token: string }[]))
    if (!data || data.length < 1000) break
  }
  return all
}

async function countAudience(req: VercelRequest, db: Db) {
  const areas = cleanAreas(String(req.query.areas ?? '').split(',').filter(Boolean))
  return { count: (await audienceFor(db, areas)).length }
}

async function resendBatch(messages: Record<string, unknown>[]) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new HttpError(500, 'E-mail isn’t configured on this site yet (RESEND_API_KEY).')
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('[newsletter] send failed:', res.status, text)
    throw new HttpError(502, `The e-mail service refused the send (${res.status}).`)
  }
}

function newsletterMessage(req: VercelRequest, campaign: CampaignRow, address: string, to: string, token: string | null) {
  const site = newsletterSiteUrl(req)
  return {
    from: process.env.NEWSLETTER_FROM_EMAIL || 'BGrowth <news@bgrowth.app>',
    to,
    subject: campaign.subject,
    html: renderCampaignEmail(campaign, site, address, token),
    ...(token
      ? {
          headers: {
            'List-Unsubscribe': `<${site}/api/newsletter?resource=unsubscribe&token=${token}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }
      : {}),
  }
}

function checkReady(campaign: CampaignRow, address: string) {
  if (!campaign.subject) throw new HttpError(400, 'Add a subject first.')
  if (!campaign.body_html.replace(/<[^>]*>/g, '').trim() && !/<img/i.test(campaign.body_html)) throw new HttpError(400, 'Write the e-mail first.')
  if (!address) throw new HttpError(400, 'Add the mailing address (required by US law) in Admin → Newsletter first.')
}

async function sendCampaignTest(req: VercelRequest, db: Db, admin: Admin) {
  const campaign = await loadCampaign(db, str(req.body?.id))
  const address = await loadNewsletterAddress(db)
  checkReady(campaign, address)
  await resendBatch([{ ...newsletterMessage(req, campaign, address, admin.email, null), subject: `[Test] ${campaign.subject}` }])
  return { sentTo: admin.email }
}

async function sendCampaign(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  const campaign = await loadCampaign(db, id)
  const address = await loadNewsletterAddress(db)
  checkReady(campaign, address)
  if (campaign.status !== 'draft') throw new HttpError(409, 'This e-mail was already sent.')
  // Claim it first so a double click can't send twice.
  const { data: claimed, error: claimError } = await db
    .from('newsletter_campaigns')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'draft')
    .select('id')
  if (claimError) throw claimError
  if (!claimed || claimed.length === 0) throw new HttpError(409, 'This e-mail is already being sent.')

  let sent = 0
  try {
    const audience = await audienceFor(db, campaign.audience_areas)
    for (let i = 0; i < audience.length; i += 100) {
      const chunk = audience.slice(i, i + 100)
      await resendBatch(chunk.map((s) => newsletterMessage(req, campaign, address, s.email, s.token)))
      sent += chunk.length
    }
  } catch (err) {
    // Nothing sent yet: back to draft so it can be retried. Partly sent:
    // keep it out of the draft list so nobody gets it twice.
    await db
      .from('newsletter_campaigns')
      .update(sent === 0 ? { status: 'draft' } : { status: 'sent', sent_count: sent, sent_at: new Date().toISOString() })
      .eq('id', id)
    throw err
  }
  const { error } = await db
    .from('newsletter_campaigns')
    .update({ status: 'sent', sent_count: sent, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  return { sent }
}

async function saveNewsletterAddress(req: VercelRequest, db: Db, admin: Admin) {
  const address = str(req.body?.address).slice(0, 300)
  const { error } = await db
    .from('site_settings')
    .upsert({ key: 'newsletter_address', value: address, updated_at: new Date().toISOString(), updated_by: admin.email })
  if (error) throw error
  return { address }
}

// ---------------------------------------------------------------------------
// Dashboard → Members: how many people signed up, confirmed their e-mail,
// got a Workspace (trial, free, purchase or access from the team), used
// one (saved a record) and bought — for a period, plus today's snapshot.
// ---------------------------------------------------------------------------
const DASH_DAY = 24 * 60 * 60 * 1000
const DASH_PERIODS: Record<string, number | null> = { '7': 7, '30': 30, '90': 90, '365': 365, all: null }

function bucketKey(date: Date, unit: 'day' | 'week' | 'month') {
  if (unit === 'month') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  if (unit === 'week') d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)) // Monday
  return d.toISOString().slice(0, 10)
}

async function memberDashboard(req: VercelRequest, db: Db) {
  const periodKey = str(req.query.period) in DASH_PERIODS ? str(req.query.period) : '30'
  const days = DASH_PERIODS[periodKey]
  const now = Date.now()
  const since = days === null ? null : now - days * DASH_DAY

  // Every sign-up (auth.users holds e-mail confirmation and last sign-in).
  const people: { id: string; createdAt: number; confirmed: boolean; confirmedAt: number | null; lastSignIn: number | null }[] = []
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) {
      people.push({
        id: u.id,
        createdAt: new Date(u.created_at).getTime(),
        confirmed: Boolean(u.email_confirmed_at),
        confirmedAt: u.email_confirmed_at ? new Date(u.email_confirmed_at).getTime() : null,
        lastSignIn: u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : null,
      })
    }
    if (data.users.length < 1000) break
  }

  const [licenses, grants, records, products, admins] = await Promise.all([
    // '*': last_opened_at only exists with the Portal's migration 0019.
    db.from('licenses').select('*'),
    db.from('access_grants').select('user_id, scope, product_id, expires_at, revoked_at'),
    db.from('workspace_instances').select('user_id, product_id, created_at, updated_at'),
    db.from('products').select('id, name, slug, is_free'),
    db.from('website_admins').select('user_id'),
  ])
  for (const r of [licenses, grants, records, products, admins]) if (r.error) throw r.error

  const staff = new Set((admins.data ?? []).map((a) => a.user_id as string))
  const freeProduct = new Set((products.data ?? []).filter((p) => p.is_free).map((p) => p.id as string))
  type Lic = {
    user_id: string
    product_id: string
    type: string
    status: string
    access_policy: string
    expires_at: string | null
    last_opened_at?: string | null
  }
  const lic = (licenses.data ?? []) as Lic[]
  const liveLicense = (l: Lic) =>
    l.status === 'active' && (l.access_policy === 'lifetime' || l.expires_at === null || new Date(l.expires_at).getTime() > now)

  const trialUsers = new Set(lic.filter((l) => l.type === 'trial').map((l) => l.user_id))
  const paidUsers = new Set(lic.filter((l) => l.type !== 'trial' && !freeProduct.has(l.product_id)).map((l) => l.user_id))
  const freeUsers = new Set(lic.filter((l) => l.type !== 'trial' && freeProduct.has(l.product_id)).map((l) => l.user_id))
  const grantUsers = new Set(((grants.data ?? []) as (GrantRow & { user_id: string })[]).map((g) => g.user_id))
  const activeGrantUsers = new Set(((grants.data ?? []) as (GrantRow & { user_id: string })[]).filter(isGrantActive).map((g) => g.user_id))
  const recordUsers = new Set((records.data ?? []).map((r) => r.user_id as string))
  const anyWorkspace = (id: string) => trialUsers.has(id) || paidUsers.has(id) || freeUsers.has(id) || grantUsers.has(id)

  // The team's own accounts don't count as members.
  const members = people.filter((p) => !staff.has(p.id))
  const cohort = since === null ? members : members.filter((p) => p.createdAt >= since)
  const count = (pred: (p: (typeof members)[number]) => boolean) => cohort.filter(pred).length

  const funnel = {
    signedUp: cohort.length,
    confirmed: count((p) => p.confirmed),
    gotWorkspace: count((p) => anyWorkspace(p.id)),
    startedTrial: count((p) => trialUsers.has(p.id)),
    usedWorkspace: count((p) => recordUsers.has(p.id)),
    bought: count((p) => paidUsers.has(p.id)),
    trialToPaid: count((p) => trialUsers.has(p.id) && paidUsers.has(p.id)),
    freeClaimed: count((p) => freeUsers.has(p.id)),
    granted: count((p) => grantUsers.has(p.id)),
  }

  const memberIds = new Set(members.map((m) => m.id))
  const trialLive = new Set(lic.filter((l) => l.type === 'trial' && liveLicense(l) && memberIds.has(l.user_id)).map((l) => l.user_id))
  const snapshot = {
    members: members.length,
    unconfirmed: members.filter((p) => !p.confirmed).length,
    trialsActive: trialLive.size,
    trialsEndedNotBought: [...trialUsers].filter((id) => memberIds.has(id) && !trialLive.has(id) && !paidUsers.has(id)).length,
    activeGrants: [...activeGrantUsers].filter((id) => memberIds.has(id)).length,
    signedInLast7Days: members.filter((p) => p.lastSignIn !== null && p.lastSignIn >= now - 7 * DASH_DAY).length,
  }

  // Sign-ups over time: by day up to a month, by week up to ~4 months, else by month.
  const first = members.reduce((min, p) => Math.min(min, p.createdAt), now)
  const spanDays = days ?? Math.max(1, Math.ceil((now - first) / DASH_DAY))
  const unit: 'day' | 'week' | 'month' = spanDays <= 31 ? 'day' : spanDays <= 120 ? 'week' : 'month'
  const start = new Date(since ?? first)
  const keys: string[] = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), unit === 'month' ? 1 : start.getUTCDate()))
  if (unit === 'week') cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7))
  while (cursor.getTime() <= now && keys.length < 400) {
    keys.push(bucketKey(cursor, unit))
    if (unit === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1)
    else if (unit === 'week') cursor.setUTCDate(cursor.getUTCDate() + 7)
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  const buckets = new Map(keys.map((k) => [k, { key: k, signedUp: 0, confirmed: 0 }]))
  for (const p of cohort) {
    const b = buckets.get(bucketKey(new Date(p.createdAt), unit))
    if (!b) continue
    b.signedUp += 1
    if (p.confirmed) b.confirmed += 1
  }

  // The 5 most used Workspaces in the period: members who opened one or
  // saved a record in it, then records saved.
  type Rec = { user_id: string; product_id: string; created_at: string; updated_at: string }
  const inPeriod = (iso: string | null | undefined) => Boolean(iso) && (since === null || new Date(iso as string).getTime() >= since)
  const usage = new Map<string, { users: Set<string>; records: number; newRecords: number }>()
  const use = (productId: string) => {
    let u = usage.get(productId)
    if (!u) usage.set(productId, (u = { users: new Set(), records: 0, newRecords: 0 }))
    return u
  }
  for (const l of lic) {
    if (memberIds.has(l.user_id) && inPeriod(l.last_opened_at)) use(l.product_id).users.add(l.user_id)
  }
  for (const r of (records.data ?? []) as Rec[]) {
    if (!memberIds.has(r.user_id) || !inPeriod(r.updated_at)) continue
    const u = use(r.product_id)
    u.users.add(r.user_id)
    u.records += 1
    if (inPeriod(r.created_at)) u.newRecords += 1
  }
  const productInfo = new Map((products.data ?? []).map((p) => [p.id as string, p as { name: string; slug: string }]))
  const topWorkspaces = [...usage.entries()]
    .map(([id, u]) => ({
      id,
      name: productInfo.get(id)?.name ?? 'Removed Workspace',
      slug: productInfo.get(id)?.slug ?? null,
      members: u.users.size,
      records: u.records,
      newRecords: u.newRecords,
    }))
    .sort((a, b) => b.members - a.members || b.records - a.records)
    .slice(0, 5)

  // Confirmation reminders sent in the period (day 1 / day 3), from the
  // e-mail log (Portal migration 0038; null until it exists) — and how many
  // of those people confirmed afterwards.
  let reminders: { day1: number; day3: number; people: number; confirmedAfter: number } | null = null
  let logQuery = db.from('email_log').select('kind, user_id, sent_at').like('kind', 'confirmation_reminder_%')
  if (since !== null) logQuery = logQuery.gte('sent_at', new Date(since).toISOString())
  const log = await logQuery
  if (!log.error) {
    const confirmedAt = new Map(people.map((p) => [p.id, p.confirmedAt]))
    const firstSent = new Map<string, number>()
    let day1 = 0
    let day3 = 0
    for (const row of (log.data ?? []) as { kind: string; user_id: string | null; sent_at: string }[]) {
      if (row.kind === 'confirmation_reminder_day1') day1 += 1
      if (row.kind === 'confirmation_reminder_day3') day3 += 1
      if (!row.user_id) continue
      const t = new Date(row.sent_at).getTime()
      firstSent.set(row.user_id, Math.min(firstSent.get(row.user_id) ?? t, t))
    }
    const confirmedAfter = [...firstSent].filter(([id, t]) => {
      const c = confirmedAt.get(id)
      return c !== null && c !== undefined && c >= t
    }).length
    reminders = { day1, day3, people: firstSent.size, confirmedAfter }
  } else if (log.error.code !== '42P01' && log.error.code !== 'PGRST205') {
    throw log.error
  }

  return { period: periodKey, unit, funnel, snapshot, series: [...buckets.values()], topWorkspaces, reminders }
}

// ---------------------------------------------------------------------------
// Catalog health: every published Workspace checked for what stops it from
// selling or working ("problems") and what makes its page weaker
// ("warnings"), plus how much it's used. And a short system check: which
// settings exist (never their values), which database updates have been
// run, and when the automatic e-mails last went out.
// ---------------------------------------------------------------------------
type Issue = { level: 'problem' | 'warning'; text: string }

async function catalogHealth(db: Db) {
  const [products, listed, categories, licenses, records, reviews] = await Promise.all([
    db
      .from('products')
      .select('id, name, slug, status, content_type, cover_image_url, short_description, category_id, is_free, price_cents, is_trial_eligible, trial_duration, metadata, content, last_published_at')
      .eq('status', 'published')
      .in('content_type', SELLABLE_TYPES)
      .order('name'),
    db.from('catalog_index').select('product_id, slug'),
    db.from('workspace_categories').select('id'),
    db.from('licenses').select('product_id, type'),
    db.from('workspace_instances').select('product_id'),
    db.from('reviews').select('product_id, rating'),
  ])
  for (const r of [products, listed, categories, licenses, records, reviews]) if (r.error) throw r.error

  const listedIds = new Set((listed.data ?? []).map((r) => r.product_id as string))
  const categoryIds = new Set((categories.data ?? []).map((c) => c.id as string))
  const count = (rows: { product_id: string }[] | null, id: string, pred: (r: any) => boolean = () => true) =>
    (rows ?? []).filter((r) => r.product_id === id && pred(r)).length

  type Row = {
    id: string
    name: string
    slug: string
    cover_image_url: string | null
    short_description: string | null
    category_id: string | null
    is_free: boolean
    price_cents: number | null
    is_trial_eligible: boolean
    trial_duration: number | null
    metadata: Record<string, unknown> | null
    content_type: string
    content: { sections?: unknown[]; files?: unknown[] } | null
    last_published_at: string | null
  }
  const workspaces = ((products.data ?? []) as Row[]).map((p) => {
    const issues: Issue[] = []
    const meta = p.metadata ?? {}
    // A Download (content_type 'pdf', Sprint 86) counts its files instead of steps.
    const sections = p.content_type === 'pdf'
      ? (Array.isArray(p.content?.files) ? p.content!.files!.length : 0)
      : Array.isArray(p.content?.sections) ? p.content!.sections!.length : 0
    const has = (key: string) => Array.isArray(meta[key]) && (meta[key] as unknown[]).length > 0
    if (!listedIds.has(p.id)) issues.push({ level: 'problem', text: 'Not listed in the catalog — publish it again from the Studio.' })
    if (!p.is_free && (p.price_cents == null || p.price_cents <= 0)) issues.push({ level: 'problem', text: 'Paid, but has no price — it can’t be bought.' })
    if (sections === 0) issues.push({ level: 'problem', text: p.content_type === 'pdf' ? 'No files — there is nothing to download.' : 'No steps in its content — it opens empty.' })
    if (p.is_trial_eligible && !p.is_free && !p.trial_duration) issues.push({ level: 'problem', text: 'Trial is on but has no length — the trial can’t start.' })
    if (!p.cover_image_url) issues.push({ level: 'warning', text: 'No cover image.' })
    if (!p.category_id) issues.push({ level: 'warning', text: 'No category — it won’t show under the category filters.' })
    else if (!categoryIds.has(p.category_id)) issues.push({ level: 'warning', text: 'Its category was deleted — choose a new one.' })
    if (!p.short_description?.trim()) issues.push({ level: 'warning', text: 'No short description (shown on the cards).' })
    if (typeof meta.longDescription !== 'string' || !(meta.longDescription as string).trim()) issues.push({ level: 'warning', text: 'No long description on its page.' })
    const missing = [!has('features') && 'benefits', !has('faq') && 'FAQ', !has('screenshots') && 'screenshots'].filter(Boolean)
    if (missing.length) issues.push({ level: 'warning', text: `Product page has no ${missing.join(', ')}.` })

    const own = (reviews.data ?? []).filter((r) => r.product_id === p.id) as { rating: number }[]
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      lastPublishedAt: p.last_published_at,
      steps: sections,
      issues,
      usage: {
        purchases: count(licenses.data as { product_id: string }[], p.id, (l) => l.type !== 'trial'),
        trials: count(licenses.data as { product_id: string }[], p.id, (l) => l.type === 'trial'),
        records: count(records.data as { product_id: string }[], p.id),
        reviews: own.length,
        rating: own.length ? Math.round((own.reduce((n, r) => n + r.rating, 0) / own.length) * 10) / 10 : null,
      },
    }
  })
  // Problems first, then warnings, then the rest.
  const weight = (w: (typeof workspaces)[number]) =>
    w.issues.some((i) => i.level === 'problem') ? 0 : w.issues.length ? 1 : 2
  workspaces.sort((a, b) => weight(a) - weight(b) || a.name.localeCompare(b.name))

  // In the catalog but no longer published (should never happen).
  const publishedIds = new Set(workspaces.map((w) => w.id))
  const orphans = (listed.data ?? []).filter((r) => !publishedIds.has(r.product_id as string)).map((r) => r.slug as string)

  // --- System ---------------------------------------------------------------
  const settings = [
    { name: 'Payments (Stripe)', ok: Boolean(process.env.STRIPE_SECRET_KEY) },
    { name: 'E-mail sending (Resend)', ok: Boolean(process.env.RESEND_API_KEY) },
    { name: 'Daily tasks (CRON_SECRET)', ok: Boolean(process.env.CRON_SECRET) },
    { name: 'Team e-mail for new messages (SUPPORT_NOTIFY_EMAIL)', ok: Boolean(process.env.SUPPORT_NOTIFY_EMAIL), optional: true },
  ]
  // 'table' or 'table.column' (an update that only added a column).
  const tableExists = async (target: string) => {
    const [table, column] = target.split('.')
    const { error } = await db.from(table).select(column ?? '*', { count: 'exact', head: true }).limit(1)
    return !error
  }
  const updates = await Promise.all(
    [
      ['0031 Support', 'support_conversations'],
      ['0036 Newsletter', 'newsletter_subscribers'],
      ['0038 E-mail log', 'email_log'],
      ['0039 Account deletion', 'account_deletion_requests'],
      ['0040 Trial after deletion', 'trial_used_emails'],
      ['0041 Bundles', 'bundle_items'],
      ['0042 Team roles & activity log', 'admin_activity'],
      ['0043 Inglês de Mudança e-mails', 'ingles_leads'],
      ['0044 Member pages', 'member_pages'],
      ['0045 Member page numbers', 'member_page_stats'],
      ['0046 Site announcements & Home highlights', 'site_announcements'],
      ['0047 Category icons & colors', 'workspace_categories.icon'],
      ['0048 Tags', 'tags'],
      ['0049 File Library (Studio → Files)', 'library_files'],
      ['0050 Product gallery', 'products.gallery'],
      ['0051 Release flow (review, approval, release date)', 'products.scheduled_publish_at'],
      ['0052 Catalog searches (Product Discovery data)', 'site_search_stats'],
      ['0053 Site texts (Admin → Site)', 'site_content'],
      ['0054 Knowledge release flow & articles', 'knowledge_articles'],
      ['0055 Knowledge members-only articles', 'knowledge_articles.locked'],
      ['0056 Wix contacts (Admin → Newsletter)', 'imported_contacts'],
      ['0057 Plans (Admin → Plans)', 'membership_plans'],
      ['0058 Plan billing (subscriptions)', 'member_plans.amount_cents'],
      ['0059 Products in Stripe (coupons per Workspace)', 'provider_products'],
      ['0060 Knowledge articles by plan', 'knowledge_articles.required_plan'],
      ['0061 Products included in plans', 'product_plan_access'],
      ['0062 Member pages with blocks (My Page editor)', 'member_pages.blocks'],
    ].map(async ([name, table]) => ({ name, ok: await tableExists(table) })),
  )
  const { data: address } = await db.from('site_settings').select('value').eq('key', 'newsletter_address').maybeSingle()
  const lastSent = async (kind: string) => {
    const { data } = await db.from('email_log').select('sent_at').like('kind', kind).order('sent_at', { ascending: false }).limit(1)
    return (data?.[0]?.sent_at as string | undefined) ?? null
  }
  const { data: lastReview } = await db
    .from('licenses')
    .select('review_requested_at')
    .not('review_requested_at', 'is', null)
    .order('review_requested_at', { ascending: false })
    .limit(1)
  const activity = [
    { name: 'Confirmation reminder (day 1 / day 3)', at: await lastSent('confirmation_reminder_%') },
    { name: 'Review request', at: (lastReview?.[0]?.review_requested_at as string | undefined) ?? null },
    { name: '“Your trial has started”', at: await lastSent('trial_started') },
    { name: '“Your Workspace is ready” (free)', at: await lastSent('free_claimed') },
  ]

  return {
    workspaces,
    orphans,
    system: {
      settings,
      updates,
      newsletterAddress: typeof address?.value === 'string' && address.value.trim().length > 0,
      activity,
    },
  }
}

// ---------------------------------------------------------------------------
// Account deletions (portal.account_deletion_requests, Portal migration
// 0039). Members ask in Settings (api/account.ts); the team completes or
// rejects here. Completing deletes the auth user — which cascades to
// portal.users, licenses, access grants, saved records, reviews, support
// conversations and the e-mail log — plus the newsletter subscription and
// any Stripe customer profile with that e-mail. Stripe keeps the payment
// records themselves (tax law). The request row stays, with the name,
// e-mail and account link cleared, as a record that it was done.
// ---------------------------------------------------------------------------
type DeletionRow = {
  id: string
  user_id: string | null
  email: string | null
  full_name: string | null
  reason: string | null
  source: string
  status: 'pending' | 'cancelled' | 'completed' | 'rejected'
  admin_note: string | null
  decided_by: string | null
  requested_at: string
  decided_at: string | null
}

async function countRows(db: Db, table: string, column: string, value: string) {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true }).eq(column, value)
  if (error) return null
  return count ?? 0
}

async function listDeletionRequests(db: Db) {
  const { data, error } = await db
    .from('account_deletion_requests')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(300)
  if (error) throw error
  const rows = (data ?? []) as DeletionRow[]
  // What would be deleted, for the pending ones.
  const requests = await Promise.all(
    rows.map(async (r) => {
      if (r.status !== 'pending' || !r.user_id) return { ...r, data: null }
      const [licenses, grants, records, reviews, conversations] = await Promise.all([
        countRows(db, 'licenses', 'user_id', r.user_id),
        countRows(db, 'access_grants', 'user_id', r.user_id),
        countRows(db, 'workspace_instances', 'user_id', r.user_id),
        countRows(db, 'reviews', 'user_id', r.user_id),
        countRows(db, 'support_conversations', 'user_id', r.user_id),
      ])
      const newsletter = r.email
        ? ((await db.from('newsletter_subscribers').select('status').eq('email', r.email.toLowerCase()).limit(1)).data?.[0]?.status ?? null)
        : null
      return { ...r, data: { licenses, grants, records, reviews, conversations, newsletter } }
    }),
  )
  return { requests: [...requests].sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1)) }
}

async function pendingDeletion(db: Db, id: string) {
  if (!id) throw new HttpError(400, 'id is required.')
  const { data, error } = await db.from('account_deletion_requests').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'Request not found.')
  const row = data as DeletionRow
  if (row.status !== 'pending') throw new HttpError(409, `This request is already ${row.status}.`)
  return row
}

const emailP = (text: string) => `<p style="margin:0 0 14px;line-height:1.6;color:#33406B">${text}</p>`
function memberEmail(heading: string, body: string) {
  return `
  <div style="background:#F4F7FD;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0A1B4D">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0;font-weight:800;font-size:18px">BGrowth</p>
      <h1 style="margin:20px 0 12px;font-size:22px">${heading}</h1>
      ${body}
    </div>
  </div>`
}

// Members → "Clean up unconfirmed" (Sprint 87): accounts that never
// confirmed their e-mail more than 14 days after signing up — almost all
// bot sign-ups. Never a team account or one with any license or access
// given by the team. Deleting also removes a newsletter subscription with
// the same e-mail; no e-mail is sent to them.
const UNCONFIRMED_DAYS = 14
const CLEANUP_BATCH = 200

// The admin picks the age (1–365 days, 14 by default).
function cleanupDays(value: unknown) {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n >= 1 && n <= 365 ? n : UNCONFIRMED_DAYS
}

async function unconfirmedAccounts(db: Db, days = UNCONFIRMED_DAYS) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const found: { id: string; email: string; createdAt: string }[] = []
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) {
      if (u.email_confirmed_at || !u.email) continue
      if (new Date(u.created_at).getTime() > cutoff) continue
      found.push({ id: u.id, email: u.email, createdAt: u.created_at })
    }
    if (data.users.length < 1000) break
  }
  if (!found.length) return found
  // Anything that ties an account to BGrowth keeps it.
  const keep = new Set<string>()
  for (let i = 0; i < found.length; i += 300) {
    const ids = found.slice(i, i + 300).map((a) => a.id)
    const lookups = await Promise.all([
      db.from('licenses').select('user_id').in('user_id', ids),
      db.from('access_grants').select('user_id').in('user_id', ids),
      db.from('website_admins').select('user_id').in('user_id', ids),
      db.from('studio_admins').select('user_id').in('user_id', ids),
    ])
    for (const r of lookups) {
      if (r.error) throw r.error
      for (const row of r.data ?? []) keep.add(row.user_id as string)
    }
  }
  return found.filter((a) => !keep.has(a.id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

async function listUnconfirmed(req: VercelRequest, db: Db) {
  const days = cleanupDays(req.query.days)
  const accounts = await unconfirmedAccounts(db, days)
  return { days, total: accounts.length, accounts: accounts.slice(0, 500) }
}

// Deletes the chosen accounts (ids), or the first 200 when none are chosen —
// always only ones that still match the rule.
async function deleteUnconfirmed(req: VercelRequest, db: Db) {
  const days = cleanupDays(req.body?.days)
  const chosen = Array.isArray(req.body?.ids) ? new Set((req.body.ids as unknown[]).map(String)) : null
  const eligible = await unconfirmedAccounts(db, days)
  const accounts = (chosen ? eligible.filter((a) => chosen.has(a.id)) : eligible).slice(0, CLEANUP_BATCH)
  let deleted = 0
  for (const a of accounts) {
    const { error } = await db.auth.admin.deleteUser(a.id)
    if (error && !/not.?found/i.test(error.message)) {
      console.error('[admin] unconfirmed cleanup failed:', a.email, error.message)
      continue
    }
    deleted++
    const nl = await db.from('newsletter_subscribers').delete().eq('email', a.email.toLowerCase())
    if (nl.error) console.error('[admin] unconfirmed cleanup newsletter:', nl.error.message)
  }
  const remaining = (await unconfirmedAccounts(db, days)).length
  return { deleted, remaining, days }
}

async function completeDeletion(req: VercelRequest, db: Db, admin: Admin) {
  const row = await pendingDeletion(db, str(req.body?.id))
  // The admin types the member's e-mail to confirm — this can't be undone.
  if (!row.email || str(req.body?.confirmEmail).toLowerCase() !== row.email.toLowerCase()) {
    throw new HttpError(400, 'Type the member’s e-mail exactly to confirm.')
  }
  const steps: string[] = []

  if (row.user_id) {
    const [web, studio] = await Promise.all([
      db.from('website_admins').select('user_id').eq('user_id', row.user_id).limit(1),
      db.from('studio_admins').select('user_id').eq('user_id', row.user_id).limit(1),
    ])
    if ((web.data?.length ?? 0) > 0 || (studio.data?.length ?? 0) > 0) {
      throw new HttpError(409, 'This is a team account. Remove it from the admin lists first.')
    }
  }

  // Already used the free trial? Keep only a fingerprint of the e-mail so a
  // new account with it doesn't get another trial (Portal migration 0040).
  if (row.user_id) {
    const [profile, trials] = await Promise.all([
      db.from('users').select('has_used_trial').eq('id', row.user_id).maybeSingle(),
      db.from('licenses').select('id', { count: 'exact', head: true }).eq('user_id', row.user_id).eq('type', 'trial'),
    ])
    const usedTrial = Boolean((profile.data as { has_used_trial?: boolean } | null)?.has_used_trial) || (trials.count ?? 0) > 0
    if (usedTrial) {
      const emailHash = createHash('sha256').update(row.email.toLowerCase(), 'utf8').digest('hex')
      // "Do nothing" on a repeat — needs only the insert grant (0040).
      const { error: hashError } = await db
        .from('trial_used_emails')
        .upsert({ email_hash: emailHash }, { onConflict: 'email_hash', ignoreDuplicates: true })
      if (hashError) {
        console.error('[admin] trial marker failed:', hashError)
        throw new HttpError(500, `Couldn’t save the trial marker (${hashError.message}). Nothing was deleted.`)
      }
      steps.push('trial marker: saved')
    }
  }

  // Newsletter (not linked by a cascade: user_id there is "set null").
  let nlCount = 0
  for (const [column, value] of [['email', row.email.toLowerCase()], ['user_id', row.user_id]] as const) {
    if (!value) continue
    const nl = await db.from('newsletter_subscribers').delete().eq(column, value).select('id')
    if (nl.error) throw nl.error
    nlCount += nl.data?.length ?? 0
  }
  steps.push(`newsletter: ${nlCount}`)

  // Stripe customer profiles with that e-mail (payments themselves stay).
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (stripeKey) {
    try {
      const stripe = new Stripe(stripeKey)
      const customers = await stripe.customers.list({ email: row.email, limit: 100 })
      for (const c of customers.data) await stripe.customers.del(c.id)
      steps.push(`stripe customers: ${customers.data.length}`)
    } catch (err) {
      console.error('[admin] stripe customer cleanup failed:', err)
      steps.push('stripe customers: not reachable')
    }
  }

  // Earlier requests of the same member (cancelled / not completed) lose
  // the name and e-mail too.
  if (row.user_id) {
    const { error: oldError } = await db
      .from('account_deletion_requests')
      .update({ email: null, full_name: null })
      .eq('user_id', row.user_id)
      .neq('id', row.id)
    if (oldError) throw oldError
  }

  // The account itself — cascades to everything linked to it.
  if (row.user_id) {
    const { error } = await db.auth.admin.deleteUser(row.user_id)
    if (error && !/not.?found/i.test(error.message)) throw error
    steps.push('account: deleted')
  }

  const first = row.full_name?.trim().split(/\s+/)[0]
  await emailMember(
    row.email,
    'Your BGrowth account has been deleted',
    memberEmail(
      'Your account has been deleted',
      emailP(first ? `Hi ${escapeHtml(first)},` : 'Hi there,') +
        emailP('As you asked, we deleted your BGrowth account and its data: your profile, Workspaces and access, saved records, reviews, support conversations and newsletter subscription.') +
        emailP('We keep only the payment records the law requires (with our payment processor, Stripe). You’re welcome back anytime — you’d just create a new account.') +
        emailP('Thank you for having been part of BGrowth.'),
    ),
  )

  const { error } = await db
    .from('account_deletion_requests')
    .update({
      status: 'completed',
      decided_at: new Date().toISOString(),
      decided_by: admin.email,
      email: null,
      full_name: null,
      user_id: null,
    })
    .eq('id', row.id)
  if (error) throw error
  console.log('[admin] account deleted:', row.id, steps.join(', '))
  return { completed: row.id, steps }
}

async function rejectDeletion(req: VercelRequest, db: Db, admin: Admin) {
  const row = await pendingDeletion(db, str(req.body?.id))
  const note = str(req.body?.note).slice(0, 1000)
  if (!note) throw new HttpError(400, 'Write the reason — it goes to the member.')
  const { error } = await db
    .from('account_deletion_requests')
    .update({ status: 'rejected', admin_note: note, decided_at: new Date().toISOString(), decided_by: admin.email })
    .eq('id', row.id)
  if (error) throw error
  if (row.email) {
    await emailMember(
      row.email,
      'About your request to delete your BGrowth account',
      memberEmail(
        'About your deletion request',
        emailP('We couldn’t complete your request to delete your BGrowth account yet:') +
          `<blockquote style="border-left:3px solid #1061EC;margin:0 0 14px;padding:4px 12px;color:#0A1B4D">${escapeHtml(note).replace(/\n/g, '<br>')}</blockquote>` +
          emailP('Just reply to this e-mail and we’ll sort it out with you.'),
      ),
    )
  }
  return { rejected: row.id }
}

// ---------------------------------------------------------------------------
// Reviews (portal.reviews, Portal migration 0009) — members' public reviews
// of Workspaces, shared by the Portal and the site. The team can read them
// all and remove one that breaks the rules (spam, abuse, personal data).
// ---------------------------------------------------------------------------
async function listReviews(db: Db) {
  const { data, error } = await db.from('reviews').select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) throw error
  const rows = (data ?? []) as {
    id: string
    user_id: string
    product_id: string
    rating: number
    title: string
    comment: string
    display_name: string
    created_from: string
    created_at: string
    updated_at: string
  }[]
  const productIds = [...new Set(rows.map((r) => r.product_id))]
  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const [products, users] = await Promise.all([
    productIds.length ? db.from('products').select('id, name, slug').in('id', productIds) : Promise.resolve({ data: [], error: null }),
    userIds.length ? db.from('users').select('id, email').in('id', userIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (products.error) throw products.error
  if (users.error) throw users.error
  const productById = new Map(((products.data ?? []) as { id: string; name: string; slug: string }[]).map((p) => [p.id, p]))
  const emailById = new Map(((users.data ?? []) as { id: string; email: string }[]).map((u) => [u.id, u.email]))
  return {
    reviews: rows.map((r) => ({
      ...r,
      product_name: productById.get(r.product_id)?.name ?? 'Removed Workspace',
      product_slug: productById.get(r.product_id)?.slug ?? null,
      email: emailById.get(r.user_id) ?? null,
    })),
  }
}

async function deleteReview(req: VercelRequest, db: Db) {
  const id = str(req.query.id ?? req.body?.id)
  if (!id) throw new HttpError(400, 'id is required.')
  const { data, error } = await db.from('reviews').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new HttpError(404, 'That review no longer exists.')
  return { removed: id }
}

// ---------------------------------------------------------------------------
// Bundles (Portal migration 0041): a portal.products row with content_type
// 'bundle' (no content, never trialled, not in catalog_index) plus its
// Workspaces in portal.bundle_items. Sold on the Website only; buying one
// gives a license for each Workspace (grant_purchased_license). Removing a
// bundle archives it, so past sales keep its name.
// ---------------------------------------------------------------------------
const BUNDLE_COLUMNS =
  'id, slug, name, short_description, cover_image_url, category_id, metadata, is_free, price_cents, currency, status, last_published_at, created_at'
const MIN_BUNDLE_CENTS = 50

type BundleProductRow = {
  id: string
  slug: string
  name: string
  short_description: string
  cover_image_url: string | null
  category_id: string | null
  metadata: Record<string, unknown> | null
  is_free: boolean
  price_cents: number | null
  currency: string
  status: string
  last_published_at: string | null
  created_at: string
}

async function listBundles(db: Db) {
  const [bundles, workspaces, categories] = await Promise.all([
    db.from('products').select(BUNDLE_COLUMNS).eq('content_type', 'bundle').neq('status', 'archived').order('created_at', { ascending: false }),
    db
      .from('products')
      .select('id, slug, name, cover_image_url, is_free, price_cents, status')
      .in('content_type', SELLABLE_TYPES)
      .neq('status', 'archived')
      .order('name'),
    loadCategories(db),
  ])
  if (bundles.error) throw bundles.error
  if (workspaces.error) throw workspaces.error
  const rows = (bundles.data ?? []) as BundleProductRow[]
  const items = rows.length
    ? await db.from('bundle_items').select('bundle_id, product_id, sort_order').in('bundle_id', rows.map((b) => b.id)).order('sort_order')
    : { data: [], error: null }
  if (items.error) throw items.error
  const itemRows = (items.data ?? []) as { bundle_id: string; product_id: string }[]
  return {
    bundles: rows.map((b) => ({
      ...b,
      long_description: typeof b.metadata?.longDescription === 'string' ? (b.metadata.longDescription as string) : '',
      item_ids: itemRows.filter((i) => i.bundle_id === b.id).map((i) => i.product_id),
    })),
    workspaces: workspaces.data ?? [],
    categories,
  }
}

async function uniqueSlug(db: Db, base: string, exceptId?: string) {
  const root = slugify(base) || 'bundle'
  for (let n = 1; n < 50; n += 1) {
    const candidate = n === 1 ? root : `${root}-${n}`
    let query = db.from('products').select('id').eq('slug', candidate).limit(1)
    if (exceptId) query = query.neq('id', exceptId)
    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) return candidate
  }
  throw new HttpError(409, 'Choose a different name — this one is taken.')
}

// Reads and checks the editor's form. Publishing needs every Workspace
// published; a draft may still include drafts.
async function readBundleInput(req: VercelRequest, db: Db) {
  const name = str(req.body?.name).slice(0, 120)
  const shortDescription = str(req.body?.shortDescription).slice(0, 300)
  const longDescription = typeof req.body?.longDescription === 'string' ? req.body.longDescription.trim().slice(0, 5000) : ''
  const isFree = req.body?.isFree === true
  const priceCents = isFree ? null : Math.round(Number(req.body?.priceCents))
  const categoryId = str(req.body?.categoryId) || null
  const coverImageUrl = str(req.body?.coverImageUrl) || null
  const status = req.body?.status === 'published' ? 'published' : 'draft'
  const itemIds: string[] = Array.isArray(req.body?.itemIds)
    ? [...new Set((req.body.itemIds as unknown[]).map((v) => str(v)).filter(Boolean))]
    : []

  if (!name) throw new HttpError(400, 'Give the bundle a name.')
  if (!shortDescription) throw new HttpError(400, 'Write a short description (shown on the cards).')
  if (!isFree && (!Number.isFinite(priceCents) || (priceCents as number) < MIN_BUNDLE_CENTS)) {
    throw new HttpError(400, 'Set a price of at least $0.50, or make it free.')
  }
  if (itemIds.length < 2) throw new HttpError(400, 'Choose at least 2 Workspaces.')
  if (coverImageUrl && !/^https:\/\//.test(coverImageUrl)) throw new HttpError(400, 'The cover must be an uploaded image.')
  if (categoryId && !(await loadCategories(db)).some((c) => c.id === categoryId)) throw new HttpError(400, 'Category not found.')

  const { data: products, error } = await db.from('products').select('id, name, status, content_type').in('id', itemIds)
  if (error) throw error
  const found = (products ?? []) as { id: string; name: string; status: string; content_type: string }[]
  if (found.length !== itemIds.length || found.some((p) => !SELLABLE_TYPES.includes(p.content_type) || p.status === 'archived')) {
    throw new HttpError(400, 'One of the chosen Workspaces is no longer available — reload and try again.')
  }
  const unpublished = found.filter((p) => p.status !== 'published')
  if (status === 'published' && unpublished.length > 0) {
    throw new HttpError(400, `Publish these Workspaces first, or save the bundle as a draft: ${unpublished.map((p) => p.name).join(', ')}.`)
  }
  return { name, shortDescription, longDescription, isFree, priceCents, categoryId, coverImageUrl, status, itemIds }
}

async function writeBundleItems(db: Db, bundleId: string, itemIds: string[]) {
  const { error: delError } = await db.from('bundle_items').delete().eq('bundle_id', bundleId)
  if (delError) throw delError
  const { error } = await db
    .from('bundle_items')
    .insert(itemIds.map((productId, i) => ({ bundle_id: bundleId, product_id: productId, sort_order: i })))
  if (error) throw error
}

async function createBundle(req: VercelRequest, db: Db, admin: Admin) {
  const input = await readBundleInput(req, db)
  const slug = await uniqueSlug(db, input.name)
  const { data, error } = await db
    .from('products')
    .insert({
      slug,
      name: input.name,
      short_description: input.shortDescription,
      cover_image_url: input.coverImageUrl,
      category_id: input.categoryId,
      content_type: 'bundle',
      content: null,
      metadata: input.longDescription ? { longDescription: input.longDescription } : {},
      is_trial_eligible: false,
      is_free: input.isFree,
      price_cents: input.priceCents,
      currency: 'usd',
      status: input.status,
      last_published_at: input.status === 'published' ? new Date().toISOString() : null,
      last_published_by: admin.email || 'website-admin',
    })
    .select(BUNDLE_COLUMNS)
    .single()
  if (error) throw error
  try {
    await writeBundleItems(db, (data as BundleProductRow).id, input.itemIds)
  } catch (err) {
    await db.from('products').delete().eq('id', (data as BundleProductRow).id)
    throw err
  }
  return { bundle: { ...(data as BundleProductRow), long_description: input.longDescription, item_ids: input.itemIds } }
}

async function updateBundle(req: VercelRequest, db: Db, admin: Admin) {
  const id = str(req.body?.id)
  const { data: current, error: currentError } = await db
    .from('products')
    .select('id, name, slug, status, metadata, content_type')
    .eq('id', id)
    .maybeSingle()
  if (currentError) throw currentError
  if (!current || current.content_type !== 'bundle' || current.status === 'archived') throw new HttpError(404, 'Bundle not found.')
  const input = await readBundleInput(req, db)
  // The address stays the same once it was published (shared links).
  const slug = current.status === 'published' || current.name === input.name ? current.slug : await uniqueSlug(db, input.name, id)
  const metadata = { ...((current.metadata as Record<string, unknown> | null) ?? {}) }
  if (input.longDescription) metadata.longDescription = input.longDescription
  else delete metadata.longDescription
  const { data, error } = await db
    .from('products')
    .update({
      slug,
      name: input.name,
      short_description: input.shortDescription,
      cover_image_url: input.coverImageUrl,
      category_id: input.categoryId,
      metadata,
      is_free: input.isFree,
      price_cents: input.priceCents,
      status: input.status,
      ...(input.status === 'published' && current.status !== 'published'
        ? { last_published_at: new Date().toISOString(), last_published_by: admin.email || 'website-admin' }
        : {}),
    })
    .eq('id', id)
    .select(BUNDLE_COLUMNS)
    .single()
  if (error) throw error
  await writeBundleItems(db, id, input.itemIds)
  return { bundle: { ...(data as BundleProductRow), long_description: input.longDescription, item_ids: input.itemIds } }
}

async function archiveBundle(req: VercelRequest, db: Db) {
  const id = str(req.query.id ?? req.body?.id)
  if (!id) throw new HttpError(400, 'id is required.')
  const { data, error } = await db
    .from('products')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('content_type', 'bundle')
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new HttpError(404, 'Bundle not found.')
  return { removed: id }
}

// ---------------------------------------------------------------------------
// Team: who can use the Admin area and with which role (Portal migration
// 0042). Admins only. Nobody changes or removes their own access here, and
// there is always at least one admin left.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Admin → Pages: members' public pages at /p/<slug> (Portal migration 0044).
// Subscribers only once Plans & Subscriptions exist; until then the team
// builds them here. Visitors read published pages straight from Supabase
// (row-level security); every write comes through here.
// ---------------------------------------------------------------------------
const MEMBER_LINK_TYPES = ['whatsapp', 'whatsapp_group', 'phone', 'booking', 'email', 'instagram', 'tiktok', 'youtube', 'website', 'other']
const PAGE_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
// Addresses the site itself uses at the top level of /p/ — kept free.
const RESERVED_PAGE_SLUGS = new Set(['admin', 'bgrowth', 'support', 'help', 'api', 'new', 'edit', 'settings'])

const isMissingTable = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code
  return code === '42P01' || code === 'PGRST205'
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function cleanUrl(value: unknown, field: string) {
  const url = cleanText(value, 500)
  if (!url) return ''
  if (!/^https:\/\/[^\s]+$/i.test(url)) throw new HttpError(400, `${field} must be a full https:// address.`)
  return url
}

// A video stays on YouTube/TikTok/Instagram; the page only embeds it.
const VIDEO_HOSTS = /^https:\/\/((www|m)\.)?(youtube\.com|youtu\.be|tiktok\.com|instagram\.com)\//i
function cleanVideoUrl(value: unknown, title: string) {
  const url = cleanText(value, 500)
  if (!url) return ''
  if (!VIDEO_HOSTS.test(url)) throw new HttpError(400, `The video of “${title}” must be a YouTube, TikTok or Instagram link.`)
  return url
}

// Each page with its owner's e-mail (the member who sees its numbers in
// the member area — Portal migration 0045).
async function withOwnerEmails(db: Db, rows: Record<string, any>[]) {
  const ids = [...new Set(rows.flatMap((r) => (r.user_id ? [r.user_id as string] : [])))]
  if (ids.length === 0) return rows.map((r) => ({ ...r, owner_email: null }))
  const { data } = await db.from('users').select('id, email').in('id', ids)
  const emailById = new Map(((data ?? []) as { id: string; email: string }[]).map((u) => [u.id, u.email]))
  return rows.map((r) => ({ ...r, owner_email: r.user_id ? emailById.get(r.user_id) ?? null : null }))
}

async function listMemberPages(db: Db) {
  const { data, error } = await db.from('member_pages').select('*').order('updated_at', { ascending: false })
  if (error) {
    if (isMissingTable(error)) return { pages: [], ready: false, openPageIds: [] }
    throw error
  }
  return { pages: await withOwnerEmails(db, data ?? []), ready: true, openPageIds: await openPageIds(db) }
}

// Pages released before launch (Sprint 145): while the site is closed
// (site_open), the published pages listed here open to everyone at their
// own address — the rest of the site stays "Coming soon". Kept in
// portal.site_settings key 'open_pages' ({ ids }), read by the public
// function (api/ingles.ts ?action=site). Admin-only.
const OPEN_PAGES_KEY = 'open_pages'

async function openPageIds(db: Db): Promise<string[]> {
  const { data, error } = await db.from('site_settings').select('value').eq('key', OPEN_PAGES_KEY).maybeSingle()
  if (error) return []
  const ids = (data?.value as { ids?: unknown } | null)?.ids
  return Array.isArray(ids) ? ids.filter((id): id is string => isUuid(id)) : []
}

async function setPageOpen(req: VercelRequest, db: Db, admin: Admin) {
  const id = str(req.body?.id)
  if (!isUuid(id)) throw new HttpError(400, 'Missing page.')
  const open = req.body?.open === true
  const { data: page, error } = await db.from('member_pages').select('id, slug, display_name, status').eq('id', id).maybeSingle()
  if (error) throw error
  if (!page) throw new HttpError(404, 'Page not found.')
  const ids = new Set(await openPageIds(db))
  if (open) ids.add(id)
  else ids.delete(id)
  const { error: saveError } = await db
    .from('site_settings')
    .upsert({ key: OPEN_PAGES_KEY, value: { ids: [...ids] }, updated_at: new Date().toISOString(), updated_by: admin.email })
  if (saveError) throw saveError
  return { id, open, page }
}

// The owner is a BGrowth account, found by its e-mail; empty = no owner.
async function resolvePageOwner(db: Db, value: unknown): Promise<string | null> {
  const email = cleanText(value, 254).toLowerCase()
  if (!email) return null
  const { data, error } = await db.from('users').select('id').ilike('email', email).limit(1)
  if (error) throw error
  const id = (data?.[0] as { id?: string } | undefined)?.id
  if (!id) throw new HttpError(400, `No BGrowth account uses ${email} — the owner must sign up first.`)
  return id
}

const STATS_DAYS = [7, 30, 90, 365]

async function memberPageStats(req: VercelRequest, db: Db) {
  const id = str(req.query.id)
  if (!isUuid(id)) throw new HttpError(400, 'Missing page.')
  const days = STATS_DAYS.includes(Number(req.query.days)) ? Number(req.query.days) : 30
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await db
    .from('member_page_stats')
    .select('day, kind, target, count')
    .eq('page_id', id)
    .gte('day', since)
    .order('day')
  if (error) {
    if (isMissingTable(error)) return { rows: [], days, ready: false }
    throw error
  }
  return { rows: data ?? [], days, ready: true }
}

// Member page blocks and theme (Sprint 127, Portal migration 0062) — the
// same cleaning in api/admin.ts and api/account.ts.
const PAGE_BLOCK_TYPES = new Set(['hero', 'contact', 'highlights', 'services', 'about', 'testimonials', 'gallery', 'text', 'faq', 'area', 'cta', 'credentials', 'products', 'signup'])
const PAGE_COLORS = new Set(['blue', 'teal', 'green', 'purple', 'rose', 'orange', 'navy'])
const PAGE_TEMPLATES = new Set(['professional', 'local', 'creative', 'personal', 'affiliate', 'links', 'cleaning', 'notary', 'teacher', 'creator', 'blank'])
// Background tints (light only — dark text stays readable), open to every plan.
const PAGE_BACKGROUNDS = new Set(['cream', 'sand', 'mist', 'sky', 'mint', 'blush', 'lavender'])
const pageText = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const pageUrl = (v: unknown) => {
  const s = pageText(v, 500)
  return /^https:\/\//.test(s) ? s : ''
}

const PRODUCT_CATEGORIES = new Set(['car', 'work', 'home', 'tech', 'travel', 'finance', 'learning', 'other'])

function cleanPageBlocks(value: unknown) {
  if (!Array.isArray(value)) return null
  const seen = new Set<string>()
  const blocks = value.slice(0, 30).flatMap((raw: any) => {
    const type = pageText(raw?.type, 20)
    if (!PAGE_BLOCK_TYPES.has(type)) return []
    let id = pageText(raw?.id, 40).replace(/[^a-zA-Z0-9_-]/g, '') || `${type}-${seen.size}`
    while (seen.has(id)) id = `${id}x`
    seen.add(id)
    const d = raw?.data && typeof raw.data === 'object' ? raw.data : {}
    const data: Record<string, unknown> = {}
    if (pageText(d.title, 120)) data.title = pageText(d.title, 120)
    if (pageText(d.body, 2000)) data.body = pageText(d.body, 2000)
    if (pageText(d.button, 40)) data.button = pageText(d.button, 40)
    // products: the member switched the standard affiliate note off (Sprint 146).
    if (type === 'products' && d.hideNote === true) data.hideNote = true
    if (Array.isArray(d.items)) {
      data.items = d.items
        .slice(0, 12)
        .map((i: any) => ({ title: pageText(i?.title, 300), body: pageText(i?.body, 600) }))
        .filter((i: { title: string }) => i.title)
    }
    if (Array.isArray(d.images)) data.images = d.images.slice(0, 12).map(pageUrl).filter(Boolean)
    // Product picks (Sprint 131): links kept exactly as typed (affiliate codes).
    if (Array.isArray(d.products)) {
      data.products = d.products.slice(0, 60).flatMap((x: any) => {
        const title = pageText(x?.title, 120)
        const url = pageText(x?.url, 1000)
        if (!title || !/^https:\/\/\S+$/.test(url)) return []
        const category = PRODUCT_CATEGORIES.has(x?.category) ? x.category : 'other'
        const image = pageUrl(x?.image)
        const description = pageText(x?.description, 300)
        const cta = pageText(x?.cta, 30)
        return [{ title, url, category, ...(description ? { description } : {}), ...(image ? { image } : {}), ...(cta ? { cta } : {}), ...(x?.favorite === true ? { favorite: true } : {}) }]
      })
    }
    return [{ id, type, ...(raw?.hidden === true ? { hidden: true } : {}), ...(Object.keys(data).length ? { data } : {}) }]
  })
  return blocks.length ? blocks : null
}

function cleanPageTheme(value: unknown) {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const theme: Record<string, string> = {}
  if (typeof v.color === 'string' && PAGE_COLORS.has(v.color)) theme.color = v.color
  const cover = pageUrl(v.cover)
  if (cover) theme.cover = cover
  if (typeof v.background === 'string' && PAGE_BACKGROUNDS.has(v.background)) theme.background = v.background
  return theme
}

function readMemberPageInput(req: VercelRequest) {
  const b = req.body ?? {}
  const slug = cleanText(b.slug, 40).toLowerCase()
  const displayName = cleanText(b.displayName, 80)
  if (!displayName) throw new HttpError(400, 'Write the name shown on the page.')
  if (!PAGE_SLUG.test(slug) || slug.length < 3) {
    throw new HttpError(400, 'The address needs 3 to 40 lowercase letters, numbers or dashes (for example “bruno”).')
  }
  if (RESERVED_PAGE_SLUGS.has(slug)) throw new HttpError(400, 'This address is reserved — choose another one.')
  const photoUrl = cleanUrl(b.photoUrl, 'The photo') || null

  const links = (Array.isArray(b.links) ? b.links : []).slice(0, 12).flatMap((raw: any) => {
    const type = MEMBER_LINK_TYPES.includes(raw?.type) ? raw.type : 'other'
    const url = cleanText(raw?.url, 300)
    if (!url) return []
    if (type === 'email' && !/^(mailto:)?[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) throw new HttpError(400, `“${url}” isn’t an e-mail address.`)
    // A WhatsApp group is its invite link (Sprint 134).
    if (type === 'whatsapp_group' && !/^https:\/\/chat\.whatsapp\.com\/\S+$/i.test(url)) {
      throw new HttpError(400, 'Paste the group’s full invite link (https://chat.whatsapp.com/…) — in WhatsApp: Group info → Invite via link → Copy link.')
    }
    if ((type === 'whatsapp' || type === 'phone') && !/^https?:\/\//.test(url) && url.replace(/\D/g, '').length < 8) {
      throw new HttpError(400, 'Write the WhatsApp number with country code (for example +1 555 123 4567).')
    }
    return [{ type, label: cleanText(raw?.label, 40), url }]
  })
  const services = (Array.isArray(b.services) ? b.services : []).slice(0, 12).flatMap((raw: any) => {
    const title = cleanText(raw?.title, 100)
    if (!title) return []
    // Its own picture and button (Sprint 145): the button opens this service's address.
    const url = cleanUrl(raw?.url, `The link of “${title}”`)
    const image = cleanUrl(raw?.image, `The image of “${title}”`)
    const cta = cleanText(raw?.cta, 40)
    return [{ title, description: cleanText(raw?.description, 400), price: cleanText(raw?.price, 40), ...(url ? { url } : {}), ...(image ? { image } : {}), ...(url && cta ? { cta } : {}) }]
  })
  const highlights = (Array.isArray(b.highlights) ? b.highlights : []).slice(0, 8).flatMap((raw: any) => {
    const title = cleanText(raw?.title, 100)
    if (!title) return []
    return [
      {
        title,
        description: cleanText(raw?.description, 400),
        url: cleanUrl(raw?.url, `The link of “${title}”`),
        image: cleanUrl(raw?.image, `The image of “${title}”`),
        video: cleanVideoUrl(raw?.video, title),
        cta: cleanText(raw?.cta, 40),
      },
    ]
  })

  return {
    slug,
    display_name: displayName,
    headline: cleanText(b.headline, 140) || null,
    bio: cleanText(b.bio, 3000) || null,
    photo_url: photoUrl,
    location: cleanText(b.location, 100) || null,
    links,
    services,
    highlights,
    language: b.language === 'pt' ? 'pt' : 'en',
    status: b.status === 'published' ? 'published' : 'draft',
    // Blocks, model and look (migration 0062) — only sent once that runs.
    ...(b.blocks !== undefined
      ? { blocks: cleanPageBlocks(b.blocks), theme: cleanPageTheme(b.theme), template: PAGE_TEMPLATES.has(b.template) ? b.template : null }
      : {}),
  }
}

async function ensurePageSlugFree(db: Db, slug: string, exceptId?: string) {
  let query = db.from('member_pages').select('id').eq('slug', slug).limit(1)
  if (exceptId) query = query.neq('id', exceptId)
  const { data, error } = await query
  if (error) {
    if (isMissingTable(error)) throw new HttpError(409, 'Run the database update (Portal migration 0044) first.')
    throw error
  }
  if (data && data.length > 0) throw new HttpError(409, `bgrowth.app/p/${slug} is already taken — choose another address.`)
  if (await slugUsedBefore(db, slug, exceptId)) throw new HttpError(409, `bgrowth.app/p/${slug} was another page's address and still leads there — choose another address.`)
}

// When a page's address changes, the old one is kept (Portal migration 0063)
// so links already shared keep working; up to 10, newest last. Before 0063
// nothing is kept.
async function previousSlugsAfter(db: Db, id: string, oldSlug: string | null | undefined, newSlug: string): Promise<{ previous_slugs?: string[] }> {
  if (!oldSlug || oldSlug === newSlug) return {}
  const { data, error } = await db.from('member_pages').select('previous_slugs').eq('id', id).maybeSingle()
  if (error) return {}
  const list = [...new Set([...(((data as { previous_slugs?: string[] } | null)?.previous_slugs) ?? []), oldSlug])].filter((s) => s !== newSlug)
  return { previous_slugs: list.slice(-10) }
}

// An address another page used before stays theirs (it redirects there).
async function slugUsedBefore(db: Db, slug: string, exceptId?: string) {
  let q = db.from('member_pages').select('id').contains('previous_slugs', [slug]).limit(1)
  if (exceptId) q = q.neq('id', exceptId)
  const { data, error } = await q
  return !error && Boolean(data && data.length)
}

async function createMemberPage(req: VercelRequest, db: Db) {
  const input = readMemberPageInput(req)
  await ensurePageSlugFree(db, input.slug)
  const userId = await resolvePageOwner(db, req.body?.ownerEmail)
  const managed = pageManagedBy(req, userId)
  const { data, error } = await db.from('member_pages').insert({ ...input, ...managed, user_id: userId }).select('*').single()
  if (error) throw error
  return { page: (await withOwnerEmails(db, [data]))[0], ...(await ownerPageWarning(db, managed, userId)) }
}

// Who edits the page (Sprint 133): the owner (owner_managed — shown only
// while their plan includes a page) or the team. Sent only by the new editor.
function pageManagedBy(req: VercelRequest, userId: string | null): { owner_managed?: boolean; signup_granted?: boolean } {
  const v = req.body?.ownerManaged
  const out: { owner_managed?: boolean; signup_granted?: boolean } = {}
  if (typeof v === 'boolean') out.owner_managed = v && Boolean(userId)
  // E-mail list switched on by the team for this page (Sprint 139, 0065).
  if (typeof req.body?.signupGranted === 'boolean') out.signup_granted = req.body.signupGranted
  return out
}

// A page's e-mail list (Sprint 139, Portal migration 0065).
//   GET ?resource=member-page-signups&id=<page> → { signups }
//   DELETE ?resource=member-page-signups&id=<page>&signup=<id>
async function memberPageSignups(req: VercelRequest, db: Db) {
  const pageId = str(req.query.id)
  if (!pageId) throw new HttpError(400, 'Missing page.')
  if (req.method === 'DELETE') {
    const { error } = await db.from('member_page_signups').delete().eq('id', str(req.query.signup)).eq('page_id', pageId)
    if (error) throw error
    return {}
  }
  const { data, error } = await db
    .from('member_page_signups')
    .select('id, email, name, whatsapp, created_at')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) {
    if (isMissingTable(error)) throw new HttpError(409, 'Run the database update (Portal migration 0065) first.')
    throw error
  }
  return { signups: data ?? [] }
}

async function ownerPageWarning(db: Db, managed: { owner_managed?: boolean }, userId: string | null) {
  if (!managed.owner_managed || !userId) return {}
  const { data } = await db.rpc('member_page_level', { p_user: userId })
  return data ? {} : { warning: 'Saved — the owner edits this page now, but their plan has no page, so it is off the site until they get one (Admin → Members → Plan).' }
}

async function updateMemberPage(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  if (!id) throw new HttpError(400, 'Missing page.')
  const input = readMemberPageInput(req)
  await ensurePageSlugFree(db, input.slug, id)
  const userId = await resolvePageOwner(db, req.body?.ownerEmail)
  const { data: before } = await db.from('member_pages').select('slug').eq('id', id).maybeSingle()
  const moved = await previousSlugsAfter(db, id, (before as { slug?: string } | null)?.slug, input.slug)
  const managed = pageManagedBy(req, userId)
  const { data, error } = await db
    .from('member_pages')
    .update({ ...input, ...moved, ...managed, user_id: userId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'This page no longer exists — reload the list.')
  return { page: (await withOwnerEmails(db, [data]))[0], ...(await ownerPageWarning(db, managed, userId)) }
}

async function deleteMemberPage(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  if (!id) throw new HttpError(400, 'Missing page.')
  const { data, error } = await db.from('member_pages').delete().eq('id', id).select('slug, display_name').maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'This page no longer exists — reload the list.')
  return { deleted: data }
}

async function listTeam(db: Db) {
  const { data, error } = await db.from('website_admins').select('*').order('created_at')
  if (error) throw error
  const rows = (data ?? []) as { user_id: string; email: string; role?: string; created_at: string }[]
  return {
    team: rows.map((r) => ({ user_id: r.user_id, email: r.email, role: r.role === 'support' ? 'support' : 'admin', created_at: r.created_at })),
  }
}

function readRole(value: unknown): AdminRole {
  if (value === 'admin' || value === 'support') return value
  throw new HttpError(400, 'Choose a role: Admin or Support.')
}

async function countAdmins(db: Db) {
  const { data, error } = await db.from('website_admins').select('*')
  if (error) throw error
  return ((data ?? []) as { role?: string }[]).filter((r) => r.role !== 'support').length
}

async function addTeamMember(req: VercelRequest, db: Db) {
  const email = str(req.body?.email).toLowerCase()
  const role = readRole(req.body?.role)
  if (!email) throw new HttpError(400, 'Enter the person’s e-mail.')
  const { data: users, error } = await db.from('users').select('id, email').ilike('email', email).limit(1)
  if (error) throw error
  const user = (users?.[0] ?? null) as { id: string; email: string } | null
  if (!user) throw new HttpError(404, 'No BGrowth account uses this e-mail. Ask the person to create one first.')
  const { data: existing } = await db.from('website_admins').select('user_id').eq('user_id', user.id).limit(1)
  if (existing && existing.length > 0) throw new HttpError(409, 'This person is already on the team.')
  const { error: insertError } = await db.from('website_admins').insert({ user_id: user.id, email: user.email, role })
  if (insertError) {
    if ((insertError as { code?: string }).code === '42703') throw new HttpError(503, 'Run the database update (Portal migration 0042) first.')
    throw insertError
  }
  return { member: { user_id: user.id, email: user.email, role, created_at: new Date().toISOString() } }
}

async function updateTeamMember(req: VercelRequest, db: Db, admin: Admin) {
  const userId = str(req.body?.userId)
  const role = readRole(req.body?.role)
  if (userId === admin.id) throw new HttpError(400, 'You can’t change your own role.')
  const { data: current, error } = await db.from('website_admins').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!current) throw new HttpError(404, 'This person isn’t on the team.')
  if (role === 'support' && (current as { role?: string }).role !== 'support' && (await countAdmins(db)) <= 1) {
    throw new HttpError(409, 'There must always be at least one Admin.')
  }
  const { error: updateError } = await db.from('website_admins').update({ role }).eq('user_id', userId)
  if (updateError) throw updateError
  return { member: { ...(current as object), role }, email: (current as { email: string }).email }
}

async function removeTeamMember(req: VercelRequest, db: Db, admin: Admin) {
  const userId = str(req.body?.userId ?? req.query.userId)
  if (userId === admin.id) throw new HttpError(400, 'You can’t remove yourself.')
  const { data: current, error } = await db.from('website_admins').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!current) throw new HttpError(404, 'This person isn’t on the team.')
  if ((current as { role?: string }).role !== 'support' && (await countAdmins(db)) <= 1) {
    throw new HttpError(409, 'There must always be at least one Admin.')
  }
  const { error: deleteError } = await db.from('website_admins').delete().eq('user_id', userId)
  if (deleteError) throw deleteError
  return { removed: userId, email: (current as { email: string }).email }
}

// ---------------------------------------------------------------------------
// Site (Portal migration 0046): announcements — the bar at the top of the
// public site and/or the bell in the member area — and the Home highlights
// (which products the Home shows, in order). Visitors read what is live
// straight from Supabase (RLS); every change goes through here.
// ---------------------------------------------------------------------------
const ANNOUNCEMENT_TONES = new Set(['news', 'promo', 'notice'])

// A link is a full https:// address or a page of this site ("/product/…").
function cleanLink(value: unknown) {
  const url = cleanText(value, 500)
  if (!url) return null
  if (/^\/[^\s]*$/.test(url) || /^https:\/\/[^\s]+$/i.test(url)) return url
  throw new HttpError(400, 'The link must start with https:// or be a page of this site (starting with /).')
}

function cleanDate(value: unknown, field: string) {
  const text = cleanText(value, 40)
  if (!text) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `${field} isn’t a valid date.`)
  return date.toISOString()
}

function readAnnouncement(raw: Record<string, unknown> | undefined) {
  const title = cleanText(raw?.title, 140)
  if (!title) throw new HttpError(400, 'Give the announcement a title.')
  const tone = cleanText(raw?.tone, 20) || 'news'
  if (!ANNOUNCEMENT_TONES.has(tone)) throw new HttpError(400, 'Unknown color.')
  const showBanner = raw?.showBanner !== false
  const showBell = raw?.showBell !== false
  if (!showBanner && !showBell) throw new HttpError(400, 'Choose where it shows: the top bar, the bell, or both.')
  const startsAt = cleanDate(raw?.startsAt, 'The start date')
  const endsAt = cleanDate(raw?.endsAt, 'The end date')
  if (startsAt && endsAt && endsAt <= startsAt) throw new HttpError(400, 'The end date must be after the start date.')
  const linkUrl = cleanLink(raw?.linkUrl)
  return {
    title,
    body: cleanText(raw?.body, 500),
    link_url: linkUrl,
    link_label: linkUrl ? cleanText(raw?.linkLabel, 40) || null : null,
    tone,
    show_banner: showBanner,
    show_bell: showBell,
    active: raw?.active !== false,
    starts_at: startsAt,
    ends_at: endsAt,
  }
}

async function siteOverview(db: Db) {
  const [announcements, featured, products, openRow] = await Promise.all([
    db.from('site_announcements').select('*').order('created_at', { ascending: false }),
    db.from('home_featured').select('product_id, sort_order').order('sort_order'),
    db
      .from('products')
      .select('id, name, slug, content_type')
      .eq('status', 'published')
      .in('content_type', [...SELLABLE_TYPES, 'bundle'])
      .order('name'),
    db.from('site_settings').select('value').eq('key', 'site_open').maybeSingle(),
  ])
  const open = openRow.data?.value === true
  if (announcements.error) {
    if (isMissingTable(announcements.error)) return { announcements: [], featured: [], products: [], ready: false, open }
    throw announcements.error
  }
  if (featured.error) throw featured.error
  if (products.error) throw products.error
  return {
    products: products.data ?? [],
    announcements: announcements.data ?? [],
    featured: ((featured.data ?? []) as { product_id: string }[]).map((f) => f.product_id),
    ready: true,
    open,
  }
}

// Open the site to everyone, or show "Coming soon" to all but the team.
async function setSiteOpen(req: VercelRequest, db: Db, admin: Admin) {
  const open = req.body?.open === true
  const { error } = await db
    .from('site_settings')
    .upsert({ key: 'site_open', value: open, updated_at: new Date().toISOString(), updated_by: admin.email })
  if (error) throw error
  return { open }
}

async function createAnnouncement(req: VercelRequest, db: Db, admin: Admin) {
  const row = readAnnouncement(req.body)
  const { data, error } = await db.from('site_announcements').insert({ ...row, created_by: admin.id }).select('*').single()
  if (error) throw error
  return { announcement: data }
}

async function updateAnnouncement(req: VercelRequest, db: Db) {
  const id = str(req.body?.id ?? req.query.id)
  if (!isUuid(id)) throw new HttpError(400, 'Missing announcement.')
  const row = readAnnouncement(req.body)
  const { data, error } = await db
    .from('site_announcements')
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'This announcement no longer exists.')
  return { announcement: data }
}

async function deleteAnnouncement(req: VercelRequest, db: Db) {
  const id = str(req.body?.id ?? req.query.id)
  if (!isUuid(id)) throw new HttpError(400, 'Missing announcement.')
  const { data, error } = await db.from('site_announcements').delete().eq('id', id).select('title').maybeSingle()
  if (error) throw error
  return { deleted: data ?? null }
}

// The whole list at once, in order (an empty list = the Home shows the
// latest products). Only published, sellable products may be highlighted.
async function saveHomeFeatured(req: VercelRequest, db: Db) {
  const raw = Array.isArray(req.body?.productIds) ? (req.body.productIds as unknown[]) : []
  const ids = [...new Set(raw.filter(isUuid))].slice(0, 12)
  if (ids.length) {
    const { data, error } = await db.from('products').select('id').in('id', ids).eq('status', 'published')
    if (error) throw error
    const found = new Set(((data ?? []) as { id: string }[]).map((p) => p.id))
    const missing = ids.filter((id) => !found.has(id))
    if (missing.length) throw new HttpError(400, 'Only published products can be highlighted on the Home.')
  }
  const { error: clearError } = await db.from('home_featured').delete().not('product_id', 'is', null)
  if (clearError) throw clearError
  if (ids.length) {
    const now = new Date().toISOString()
    const { error } = await db.from('home_featured').insert(ids.map((id, i) => ({ product_id: id, sort_order: i, updated_at: now })))
    if (error) throw error
  }
  return { featured: ids }
}

// ---------------------------------------------------------------------------
// Tags (Portal migration 0048): one list for products — and later articles —
// shared with BGrowth Studio's publish screens. A tag's key (tagSlug — the
// same rule as portal.tag_slug() and the Portal's publish endpoint) keeps
// "Notary" and "notary " one tag. A product's tags are portal.product_tags.
// ---------------------------------------------------------------------------
function tagSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function readTagName(value: unknown) {
  const name = cleanText(value, 60).replace(/\s+/g, ' ')
  if (!name || !tagSlug(name)) throw new HttpError(400, 'Give the tag a name with letters or numbers.')
  return name
}

async function listTags(db: Db) {
  const [tags, links, products] = await Promise.all([
    db.from('tags').select('id, name, slug, source, created_at').order('name'),
    db.from('product_tags').select('product_id, tag_id'),
    db
      .from('products')
      .select('id, name, slug, content_type, status')
      .neq('status', 'archived')
      .in('content_type', [...SELLABLE_TYPES, 'bundle'])
      .order('name'),
  ])
  if (tags.error) {
    if (isMissingTable(tags.error)) return { tags: [], links: [], products: [], ready: false }
    throw tags.error
  }
  if (links.error) throw links.error
  if (products.error) throw products.error
  return { tags: tags.data ?? [], links: links.data ?? [], products: products.data ?? [], ready: true }
}

async function createTag(req: VercelRequest, db: Db) {
  const name = readTagName(req.body?.name)
  const slug = tagSlug(name)
  const { data: existing } = await db.from('tags').select('id, name').eq('slug', slug).maybeSingle()
  if (existing) throw new HttpError(409, `“${(existing as { name: string }).name}” is already in the list.`)
  const { data, error } = await db.from('tags').insert({ name, slug, source: 'admin' }).select('*').single()
  if (error) throw error
  return { tag: data }
}

async function renameTag(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  const name = readTagName(req.body?.name)
  const slug = tagSlug(name)
  const { data: other } = await db.from('tags').select('id, name').eq('slug', slug).neq('id', id).maybeSingle()
  if (other) throw new HttpError(409, `“${(other as { name: string }).name}” already exists — use Merge to join them.`)
  const { data, error } = await db.from('tags').update({ name, slug }).eq('id', id).select('*').maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'Tag not found.')
  return { tag: data }
}

async function deleteTag(req: VercelRequest, db: Db) {
  const id = str(req.body?.id ?? req.query.id)
  const { data, error } = await db.from('tags').delete().eq('id', id).select('name').maybeSingle()
  if (error) throw error
  return { deleted: data ?? null }
}

// Join `fromId` into `intoId`: its products get the other tag, then it goes.
async function mergeTags(req: VercelRequest, db: Db) {
  const fromId = str(req.body?.fromId)
  const intoId = str(req.body?.intoId)
  if (!fromId || !intoId || fromId === intoId) throw new HttpError(400, 'Choose two different tags.')
  const { data: pair, error } = await db.from('tags').select('id, name').in('id', [fromId, intoId])
  if (error) throw error
  const from = (pair ?? []).find((t) => (t as { id: string }).id === fromId) as { name: string } | undefined
  const into = (pair ?? []).find((t) => (t as { id: string }).id === intoId) as { name: string } | undefined
  if (!from || !into) throw new HttpError(404, 'Tag not found.')
  const { data: links, error: linksError } = await db.from('product_tags').select('product_id').eq('tag_id', fromId)
  if (linksError) throw linksError
  const rows = ((links ?? []) as { product_id: string }[]).map((l) => ({ product_id: l.product_id, tag_id: intoId }))
  if (rows.length) {
    const { error: upsertError } = await db.from('product_tags').upsert(rows, { onConflict: 'product_id,tag_id', ignoreDuplicates: true })
    if (upsertError) throw upsertError
  }
  const { error: deleteError } = await db.from('tags').delete().eq('id', fromId)
  if (deleteError) throw deleteError
  return { merged: { from: from.name, into: into.name, products: rows.length } }
}

// A product's tags, by name — existing tags are reused, new ones join the
// list.
async function setProductTags(req: VercelRequest, db: Db) {
  const productId = str(req.body?.productId)
  if (!isUuid(productId)) throw new HttpError(400, 'Missing product.')
  const raw = Array.isArray(req.body?.names) ? (req.body.names as unknown[]) : []
  const wanted = new Map<string, string>()
  for (const value of raw) {
    const name = cleanText(value, 60).replace(/\s+/g, ' ')
    const slug = tagSlug(name)
    if (slug && !wanted.has(slug)) wanted.set(slug, name)
  }
  if (wanted.size > 20) throw new HttpError(400, 'Up to 20 tags per product.')
  const slugs = [...wanted.keys()]
  if (slugs.length) {
    const { error } = await db
      .from('tags')
      .upsert(slugs.map((slug) => ({ slug, name: wanted.get(slug), source: 'admin' })), { onConflict: 'slug', ignoreDuplicates: true })
    if (error) throw error
  }
  const { data: tags, error: readError } = slugs.length ? await db.from('tags').select('id, name, slug, source, created_at').in('slug', slugs) : { data: [], error: null }
  if (readError) throw readError
  const { error: clearError } = await db.from('product_tags').delete().eq('product_id', productId)
  if (clearError) throw clearError
  if (tags?.length) {
    const { error } = await db.from('product_tags').insert((tags as { id: string }[]).map((t) => ({ product_id: productId, tag_id: t.id })))
    if (error) throw error
  }
  const { data: product } = await db.from('products').select('name').eq('id', productId).maybeSingle()
  return { productId, tags: tags ?? [], productName: (product as { name?: string } | null)?.name ?? '' }
}

// ---------------------------------------------------------------------------
// Site texts (Portal migration 0053, portal.site_content): pieces of the
// public site edited in Admin → Site. No row = the site shows its built-in
// text; "Restore original" deletes the row. English only for now (locale
// 'en'). First: the legal pages (keys legal:privacy, legal:terms,
// legal:refund-policy). Visitors read straight from Supabase (RLS).
// ---------------------------------------------------------------------------
const LEGAL_NAMES: Record<string, string> = {
  'legal:privacy': 'Privacy Policy',
  'legal:terms': 'Terms of Service',
  'legal:refund-policy': 'Refund Policy',
}
const SITE_CONTENT_NAMES: Record<string, string> = { ...LEGAL_NAMES, seo: 'SEO', navigation: 'Menu & footer', 'page-texts': 'Page texts' }

// Menu & footer (key "navigation"): link lists (a page of this site or an
// https:// address), two footer sentences and the social network addresses.
const SOCIAL_KEYS = ['instagram', 'facebook', 'youtube', 'linkedin', 'tiktok', 'pinterest', 'whatsapp', 'threads', 'x', 'telegram', 'snapchat', 'spotify']

function readLinks(value: unknown, field: string, max: number) {
  if (!Array.isArray(value)) return []
  return (value as Record<string, unknown>[]).slice(0, max).map((l) => {
    const label = cleanText(l?.label, 40)
    const to = cleanText(l?.to, 300)
    if (!label || !to) throw new HttpError(400, `${field}: every link needs a name and an address.`)
    if (!/^\/[^\s]*$/.test(to) && !/^https:\/\/[^\s]+$/i.test(to)) {
      throw new HttpError(400, `${field}: “${label}” must link to a page of this site (starting with /) or a full https:// address.`)
    }
    return { label, to }
  })
}

// Page texts (key "page-texts"): { fieldId: text | list of short lines }.
// Field ids and built-in texts live in the site (data/pageTexts.ts); an empty
// field is dropped so the page shows its built-in text.
function readPageTexts(raw: Record<string, unknown> | undefined) {
  const out: Record<string, string | string[]> = {}
  for (const [id, value] of Object.entries(raw ?? {}).slice(0, 300)) {
    if (!/^[a-z0-9.]{3,80}$/.test(id)) continue
    if (Array.isArray(value)) {
      const items = cleanList(value, 20, 120)
      if (items.length) out[id] = items
    } else {
      const text = cleanText(value, 1500)
      if (text) out[id] = text
    }
  }
  return out
}

function readNavigationContent(raw: Record<string, unknown> | undefined) {
  const menu = readLinks(raw?.menu, 'Top menu', 8)
  if (!menu.length) throw new HttpError(400, 'The top menu needs at least one link.')
  const rawSocials = raw?.socials && typeof raw.socials === 'object' ? (raw.socials as Record<string, unknown>) : {}
  const socials: Record<string, string> = {}
  for (const key of SOCIAL_KEYS) {
    const url = cleanText(rawSocials[key], 300)
    if (!url) continue
    if (!/^https:\/\/[^\s]+$/i.test(url)) throw new HttpError(400, `The ${key} address must be a full https:// address.`)
    socials[key] = url
  }
  return {
    menu,
    footerLinks: readLinks(raw?.footerLinks, 'Footer links', 12),
    legalLinks: readLinks(raw?.legalLinks, 'Bottom links', 8),
    tagline: cleanText(raw?.tagline, 200),
    newsletterText: cleanText(raw?.newsletterText, 150),
    socials,
  }
}

// SEO (key "seo"): per page (by its address) a Google title/description and
// a share image, plus the default share image for every other link.
function cleanImage(value: unknown) {
  const url = cleanText(value, 500)
  if (!url) return ''
  if (!/^https:\/\/[^\s]+$/i.test(url)) throw new HttpError(400, 'An image must be a full https:// address.')
  return url
}

function readSeoContent(raw: Record<string, unknown> | undefined) {
  const rawPages = raw?.pages && typeof raw.pages === 'object' ? (raw.pages as Record<string, Record<string, unknown>>) : {}
  const pages: Record<string, { title: string; description: string; image: string }> = {}
  for (const [path, page] of Object.entries(rawPages).slice(0, 40)) {
    if (!/^\/[a-z0-9\-/]*$/.test(path)) continue
    const entry = { title: cleanText(page?.title, 70), description: cleanText(page?.description, 300), image: cleanImage(page?.image) }
    if (entry.title || entry.description || entry.image) pages[path] = entry
  }
  return { defaultImage: cleanImage(raw?.defaultImage), pages }
}

function cleanList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => cleanText(v, maxLength))
    .filter((v): v is string => Boolean(v))
    .slice(0, maxItems)
}

function readLegalContent(raw: Record<string, unknown> | undefined) {
  const title = cleanText(raw?.title, 120)
  if (!title) throw new HttpError(400, 'Give the page a title.')
  const sections = (Array.isArray(raw?.sections) ? (raw?.sections as Record<string, unknown>[]) : [])
    .slice(0, 40)
    .map((s) => ({
      heading: cleanText(s?.heading, 160) ?? '',
      paragraphs: cleanList(s?.paragraphs, 30, 4000),
      bullets: cleanList(s?.bullets, 40, 1000),
    }))
    .filter((s) => s.heading || s.paragraphs.length || s.bullets.length)
  if (!sections.length) throw new HttpError(400, 'The page needs at least one section.')
  if (sections.some((s) => !s.heading)) throw new HttpError(400, 'Every section needs a heading.')
  return { title, summary: cleanText(raw?.summary, 500) ?? '', sections }
}

function siteContentKey(value: unknown) {
  const key = cleanText(value, 100) ?? ''
  if (!SITE_CONTENT_NAMES[key]) throw new HttpError(400, 'Unknown part of the site.')
  return key
}

async function getSiteContent(req: VercelRequest, db: Db) {
  const key = siteContentKey(req.query.key)
  const { data, error } = await db.from('site_content').select('value, updated_at, updated_by').eq('key', key).eq('locale', 'en').maybeSingle()
  if (error) {
    if (isMissingTable(error)) return { key, content: null, ready: false }
    throw error
  }
  return { key, content: data ?? null, ready: true }
}

async function saveSiteContent(req: VercelRequest, db: Db, admin: Admin) {
  const key = siteContentKey(req.body?.key)
  const value =
    key === 'seo'
      ? readSeoContent(req.body?.value)
      : key === 'navigation'
        ? readNavigationContent(req.body?.value)
        : key === 'page-texts'
          ? readPageTexts(req.body?.value)
          : readLegalContent(req.body?.value)
  const { data, error } = await db
    .from('site_content')
    .upsert({ key, locale: 'en', value, updated_at: new Date().toISOString(), updated_by: admin.email })
    .select('value, updated_at, updated_by')
    .single()
  if (error) {
    if (isMissingTable(error)) throw new HttpError(400, 'Run the database update (Portal migration 0053) first.')
    throw error
  }
  return { key, content: data, title: SITE_CONTENT_NAMES[key] }
}

async function resetSiteContent(req: VercelRequest, db: Db) {
  const key = siteContentKey(req.body?.key ?? req.query.key)
  const { error } = await db.from('site_content').delete().eq('key', key).eq('locale', 'en')
  if (error) throw error
  return { key, reset: true, title: SITE_CONTENT_NAMES[key] }
}

// ---------------------------------------------------------------------------
// Plans (Portal migration 0057, Sprint 121): the plans BGrowth offers and
// what each one unlocks, edited here; the plan a member has (paid, or given
// by the team: a promotion, a giveaway, a referral…). Selling them is step 2.
// ---------------------------------------------------------------------------
const PLAN_STATUSES = new Set(['active', 'hidden', 'disabled'])
const PLAN_REASONS = new Set(['promotion', 'giveaway', 'referral', 'support', 'other'])
const DEFAULT_PLAN_SETTINGS = { provider: 'stripe', cancelAt: 'period_end', graceDays: 7, allowSwitch: true, yearlyDiscountPercent: 20 }
const PLAN_COLUMNS =
  'id, slug, name, description, rank, status, is_free, price_on_request, currency, monthly_cents, yearly_cents, monthly_sale_cents, yearly_sale_cents, features, highlighted, entitlements, updated_at'

function notReady(error: unknown) {
  const code = (error as { code?: string } | null)?.code
  return code === '42P01' || code === 'PGRST205'
}

function cents(value: unknown, field: string): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 100000) throw new HttpError(400, `${field}: enter a price between 0 and 100,000.`)
  return Math.round(n * 100)
}

function percent(value: unknown, field: string): number {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new HttpError(400, `${field}: enter a percentage between 0 and 100.`)
  return Math.round(n)
}

// What a plan unlocks. Only what is set is kept (an empty object = nothing).
function cleanEntitlements(value: unknown) {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, any>
  const out: Record<string, unknown> = {}
  if (v.memberPage === 'partial' || v.memberPage === 'full') out.memberPage = v.memberPage
  if (v.prioritySupport === true) out.prioritySupport = true
  // Which page models the plan allows (Sprint 132); none listed = all.
  if (out.memberPage && Array.isArray(v.pageTemplates)) {
    const list = [...new Set(v.pageTemplates.filter((t: unknown) => typeof t === 'string' && PAGE_TEMPLATES.has(t)))]
    if (list.length && list.length < PAGE_TEMPLATES.size) out.pageTemplates = list
  }
  // Opens every product while the plan is live (Portal migration 0061).
  if (v.includesAll === true) out.includesAll = true
  const ws = percent(v.workspaceDiscountPercent, 'Workspace discount')
  if (ws > 0) out.workspaceDiscountPercent = ws
  const ac = v.academyDiscount
  if (ac && typeof ac === 'object') {
    const p = percent(ac.percent, 'Academy discount')
    if (p > 0) {
      const courses = Array.isArray(ac.courses)
        ? [...new Set(ac.courses.map((c: unknown) => cleanText(c, 120)).filter(Boolean))].slice(0, 50)
        : []
      out.academyDiscount = { percent: p, scope: ac.scope === 'selected' && courses.length ? 'selected' : 'all', courses: ac.scope === 'selected' ? courses : [] }
    }
  }
  return out
}

function readPlanInput(req: VercelRequest) {
  const b = (req.body ?? {}) as Record<string, any>
  const name = cleanText(b.name, 60)
  if (!name) throw new HttpError(400, 'Give the plan a name.')
  const status = PLAN_STATUSES.has(b.status) ? b.status : 'hidden'
  const rank = Math.round(Number(b.rank))
  if (!Number.isFinite(rank) || rank < 0 || rank > 1000) throw new HttpError(400, 'Order: enter a number from 0 to 1000.')
  const isFree = b.isFree === true
  const onRequest = !isFree && b.priceOnRequest === true
  const monthly = isFree ? 0 : onRequest ? null : cents(b.monthly, 'Monthly price')
  const yearly = isFree ? 0 : onRequest ? null : cents(b.yearly, 'Yearly price')
  const monthlySale = isFree || onRequest ? null : cents(b.monthlySale, 'Monthly sale price')
  const yearlySale = isFree || onRequest ? null : cents(b.yearlySale, 'Yearly sale price')
  if (!isFree && !onRequest && monthly === null && yearly === null) throw new HttpError(400, 'Enter a monthly or a yearly price (or mark it “Free” or “Price on request”).')
  if (monthlySale !== null && (monthly === null || monthlySale >= monthly)) throw new HttpError(400, 'The monthly sale price must be lower than the monthly price.')
  if (yearlySale !== null && (yearly === null || yearlySale >= yearly)) throw new HttpError(400, 'The yearly sale price must be lower than the yearly price.')
  const features = Array.isArray(b.features) ? b.features.map((f: unknown) => cleanText(f, 160)).filter(Boolean).slice(0, 20) : []
  return {
    name,
    description: cleanText(b.description, 240),
    rank,
    status,
    is_free: isFree,
    price_on_request: onRequest,
    monthly_cents: monthly,
    yearly_cents: yearly,
    monthly_sale_cents: monthlySale,
    yearly_sale_cents: yearlySale,
    features,
    highlighted: b.highlighted === true,
    entitlements: cleanEntitlements(b.entitlements),
    updated_at: new Date().toISOString(),
  }
}

async function loadPlanSettings(db: Db) {
  const { data } = await db.from('site_settings').select('value').eq('key', 'plans').maybeSingle()
  return { ...DEFAULT_PLAN_SETTINGS, ...((data?.value as Record<string, unknown> | undefined) ?? {}) }
}

const isLivePlan = (m: { status: string; starts_at: string; ends_at: string | null }, now = Date.now()) =>
  ['active', 'trialing', 'past_due'].includes(m.status) && Date.parse(m.starts_at) <= now && (!m.ends_at || Date.parse(m.ends_at) > now)

async function listPlans(db: Db) {
  const { data, error } = await db.from('membership_plans').select(PLAN_COLUMNS).order('rank')
  if (error) {
    if (notReady(error)) return { ready: false, plans: [], settings: DEFAULT_PLAN_SETTINGS }
    throw error
  }
  const { data: members, error: mError } = await db.from('member_plans').select('plan_id, source, status, starts_at, ends_at')
  if (mError) throw mError
  const counts = new Map<string, { paid: number; given: number }>()
  for (const m of (members ?? []) as { plan_id: string; source: string; status: string; starts_at: string; ends_at: string | null }[]) {
    if (!isLivePlan(m)) continue
    const c = counts.get(m.plan_id) ?? { paid: 0, given: 0 }
    if (m.source === 'subscription') c.paid += 1
    else c.given += 1
    counts.set(m.plan_id, c)
  }
  return {
    ready: true,
    plans: (data ?? []).map((p: Record<string, any>) => ({ ...p, members: counts.get(p.id) ?? { paid: 0, given: 0 } })),
    settings: await loadPlanSettings(db),
  }
}

// A paid plan's own Stripe product (Sprint 124), made when the plan is saved
// so coupons can be limited to it before its first sale. Renamed in Stripe
// when the plan is. Best effort: a Stripe problem never blocks saving.
async function ensurePlanProduct(db: Db, plan: Record<string, any>) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || plan.is_free || plan.price_on_request) return
  try {
    const stripe = new Stripe(key)
    const stored = (plan.provider_prices?.stripe ?? {}) as { product?: string; prices?: Record<string, string> }
    const name = `BGrowth ${plan.name} plan`
    if (stored.product) {
      await stripe.products.update(stored.product, { name })
      return
    }
    const product = await stripe.products.create({ name, metadata: { kind: 'plan', plan_id: plan.id, plan_slug: plan.slug } })
    const next = { ...(plan.provider_prices ?? {}), stripe: { ...stored, product: product.id } }
    await db.from('membership_plans').update({ provider_prices: next }).eq('id', plan.id)
  } catch (err) {
    console.warn('[admin] plan product not created in Stripe:', err instanceof Error ? err.message : err)
  }
}

async function createPlan(req: VercelRequest, db: Db) {
  const input = readPlanInput(req)
  const slug = slugify(cleanText(req.body?.slug, 40) || input.name)
  if (!slug) throw new HttpError(400, 'Give the plan a name with letters or numbers.')
  const { data: taken } = await db.from('membership_plans').select('id').eq('slug', slug).maybeSingle()
  if (taken) throw new HttpError(409, `There is already a plan with the address “${slug}”.`)
  const { data, error } = await db.from('membership_plans').insert({ ...input, slug }).select(PLAN_COLUMNS).single()
  if (error) {
    if (notReady(error)) throw new HttpError(409, 'Run the database update (Portal migration 0057) first.')
    throw error
  }
  await ensurePlanProduct(db, { ...data, provider_prices: {} })
  return { plan: { ...data, members: { paid: 0, given: 0 } } }
}

async function updatePlan(req: VercelRequest, db: Db) {
  const id = str(req.body?.id)
  if (!isUuid(id)) throw new HttpError(400, 'Which plan?')
  const input = readPlanInput(req)
  const { data: current } = await db.from('membership_plans').select('slug').eq('id', id).maybeSingle()
  if (!current) throw new HttpError(404, 'Plan not found.')
  // Every member without a plan is on Free, so it can't be switched off.
  if (current.slug === 'free' && (input.status !== 'active' || !input.is_free)) throw new HttpError(400, 'Free is the plan of every member without one — it stays active and free.')
  const { data, error } = await db.from('membership_plans').update(input).eq('id', id).select(`${PLAN_COLUMNS}, provider_prices`).single()
  if (error) throw error
  await ensurePlanProduct(db, data)
  const { provider_prices: _skip, ...plan } = data as Record<string, any>
  return { plan }
}

async function savePlanSettings(req: VercelRequest, db: Db, admin: Admin) {
  const b = (req.body ?? {}) as Record<string, any>
  const graceDays = Math.round(Number(b.graceDays))
  if (!Number.isFinite(graceDays) || graceDays < 0 || graceDays > 30) throw new HttpError(400, 'Days of tolerance: 0 to 30.')
  const settings = {
    // Only Stripe exists today; another provider becomes one more option here.
    provider: 'stripe',
    cancelAt: b.cancelAt === 'now' ? 'now' : 'period_end',
    graceDays,
    allowSwitch: b.allowSwitch !== false,
    yearlyDiscountPercent: percent(b.yearlyDiscountPercent, 'Yearly discount'),
  }
  const { error } = await db
    .from('site_settings')
    .upsert({ key: 'plans', value: settings, updated_at: new Date().toISOString(), updated_by: admin.email })
  if (error) throw error
  return { settings }
}

async function listMemberPlans(req: VercelRequest, db: Db) {
  const userId = str(req.query.userId)
  if (!isUuid(userId)) throw new HttpError(400, 'Which member?')
  const [rows, plans] = await Promise.all([
    db
      .from('member_plans')
      .select('id, plan_id, source, reason, note, status, billing_interval, provider, starts_at, ends_at, current_period_end, cancel_at_period_end, created_at, membership_plans(name, slug, rank)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    db.from('membership_plans').select('id, name, slug, rank, status, is_free').order('rank'),
  ])
  if (rows.error) {
    if (notReady(rows.error)) return { ready: false, entries: [], plans: [], current: 'free' }
    throw rows.error
  }
  if (plans.error) throw plans.error
  const entries: Record<string, any>[] = (rows.data ?? []).map((r: Record<string, any>) => ({ ...r, live: isLivePlan(r as any) }))
  const top = entries
    .filter((e) => e.live)
    .sort((a, b) => (b.membership_plans?.rank ?? 0) - (a.membership_plans?.rank ?? 0))[0]
  return { ready: true, entries, plans: plans.data ?? [], current: top?.membership_plans?.name ?? 'Free' }
}

async function giveMemberPlan(req: VercelRequest, db: Db, admin: Admin) {
  const b = (req.body ?? {}) as Record<string, any>
  const userId = str(b.userId)
  const planId = str(b.planId)
  if (!isUuid(userId) || !isUuid(planId)) throw new HttpError(400, 'Choose the member and the plan.')
  const { data: plan } = await db.from('membership_plans').select('id, name, status, is_free').eq('id', planId).maybeSingle()
  if (!plan) throw new HttpError(404, 'Plan not found.')
  if (plan.is_free) throw new HttpError(400, 'Every member already has Free — choose another plan.')
  if (plan.status === 'disabled') throw new HttpError(400, `“${plan.name}” is disabled. Turn it back on in Admin → Plans first.`)
  const reason = PLAN_REASONS.has(b.reason) ? b.reason : 'other'
  const { data, error } = await db
    .from('member_plans')
    .insert({
      user_id: userId,
      plan_id: planId,
      source: 'team',
      reason,
      note: cleanText(b.note, 300) || null,
      status: 'active',
      ends_at: futureDate(b.endsAt, 'End date'),
      granted_by: admin.id,
    })
    .select('*')
    .single()
  if (error) {
    if (notReady(error)) throw new HttpError(409, 'Run the database update (Portal migration 0057) first.')
    throw error
  }
  return { memberPlan: data, planName: plan.name }
}

async function changeMemberPlan(req: VercelRequest, db: Db) {
  const b = (req.body ?? {}) as Record<string, any>
  const id = str(b.id)
  if (!isUuid(id)) throw new HttpError(400, 'Which plan?')
  const { data: row } = await db.from('member_plans').select('id, user_id, source, membership_plans(name)').eq('id', id).maybeSingle()
  if (!row) throw new HttpError(404, 'Not found.')
  if (row.source !== 'team') throw new HttpError(400, 'A paid subscription is changed by the member (or in the payment provider), not here.')
  const now = new Date().toISOString()
  const patch =
    b.action === 'end'
      ? { status: 'ended', ends_at: now, updated_at: now }
      : { status: 'active', ends_at: futureDate(b.endsAt, 'End date'), updated_at: now }
  const { data, error } = await db.from('member_plans').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return { memberPlan: data, planName: (row as any).membership_plans?.name ?? 'a plan', user_id: row.user_id }
}

// Admin → Plans → Included (Sprint 126, Portal migration 0061): which
// products a plan opens without buying — each product's lowest plan.
async function listPlanProducts(db: Db) {
  const [products, links, plans] = await Promise.all([
    db
      .from('products')
      .select('id, name, slug, content_type, is_free, status, category_id')
      .in('content_type', SELLABLE_TYPES)
      .neq('status', 'archived')
      .order('name'),
    db.from('product_plan_access').select('product_id, plan_id'),
    db.from('membership_plans').select('id, name, rank, is_free, status, entitlements').order('rank'),
  ])
  if (links.error) {
    if (notReady(links.error)) return { ready: false, products: [], plans: [], included: {} }
    throw links.error
  }
  if (products.error) throw products.error
  if (plans.error) throw plans.error
  return {
    ready: true,
    products: products.data ?? [],
    plans: ((plans.data ?? []) as Record<string, any>[])
      .filter((p) => !p.is_free)
      .map((p) => ({ id: p.id, name: p.name, rank: p.rank, status: p.status, includesAll: Boolean(p.entitlements?.includesAll) })),
    included: Object.fromEntries(((links.data ?? []) as { product_id: string; plan_id: string }[]).map((l) => [l.product_id, l.plan_id])),
  }
}

async function setPlanProduct(req: VercelRequest, db: Db) {
  const productIds: string[] = (Array.isArray(req.body?.productIds) ? req.body.productIds : [req.body?.productId]).filter(isUuid)
  if (!productIds.length) throw new HttpError(400, 'Choose the products.')
  const planId = req.body?.planId ? str(req.body.planId) : null
  let planName: string | null = null
  if (planId) {
    const { data: plan } = await db.from('membership_plans').select('id, name, is_free').eq('id', planId).maybeSingle()
    if (!plan || plan.is_free) throw new HttpError(400, 'Choose a paid plan.')
    planName = plan.name
    const { error } = await db
      .from('product_plan_access')
      .upsert(productIds.map((id) => ({ product_id: id, plan_id: planId, updated_at: new Date().toISOString() })))
    if (error) {
      if (notReady(error)) throw new HttpError(409, 'Run the database update (Portal migration 0061) first.')
      throw error
    }
  } else {
    const { error } = await db.from('product_plan_access').delete().in('product_id', productIds)
    if (error) throw error
  }
  const { data: names } = await db.from('products').select('name').in('id', productIds)
  return { planName, count: productIds.length, names: ((names ?? []) as { name: string }[]).map((n) => n.name) }
}

// Admin → Plans → Subscribers (Sprint 122, migration 0058): every paid
// subscription, the monthly revenue (yearly plans count 1/12 a month) and
// cancellations in the last 30 days.
async function listPlanSubscribers(db: Db) {
  const { data, error } = await db
    .from('member_plans')
    .select('id, user_id, plan_id, status, billing_interval, starts_at, ends_at, current_period_end, cancel_at_period_end, amount_cents, currency, canceled_at, membership_plans(name)')
    .eq('source', 'subscription')
    .order('created_at', { ascending: false })
  if (error) {
    if (notReady(error) || (error as { code?: string }).code === '42703') return { ready: false, subscribers: [], stats: null }
    throw error
  }
  const rows = (data ?? []) as Record<string, any>[]
  const ids = [...new Set(rows.map((r) => r.user_id))]
  const { data: users } = ids.length ? await db.from('users').select('id, email, full_name').in('id', ids) : { data: [] }
  const byId = new Map(((users ?? []) as { id: string; email: string; full_name: string | null }[]).map((u) => [u.id, u]))
  const now = Date.now()
  const subscribers: Record<string, any>[] = rows.map((r) => ({
    ...r,
    live: isLivePlan(r as any, now),
    email: byId.get(r.user_id)?.email ?? null,
    name: byId.get(r.user_id)?.full_name ?? null,
    plan_name: r.membership_plans?.name ?? 'Plan',
  }))
  const live = subscribers.filter((s) => s.live)
  const mrr = live.reduce((sum, s) => sum + (s.amount_cents ?? 0) / (s.billing_interval === 'year' ? 12 : 1), 0)
  const { count: given } = await db.from('member_plans').select('id', { count: 'exact', head: true }).eq('source', 'team').eq('status', 'active')
  return {
    ready: true,
    subscribers,
    stats: {
      paying: live.length,
      mrrCents: Math.round(mrr),
      cancelling: live.filter((s) => s.cancel_at_period_end).length,
      pastDue: live.filter((s) => s.status === 'past_due').length,
      canceled30: subscribers.filter((s) => s.canceled_at && Date.parse(s.canceled_at) > now - 30 * 86400000).length,
      given: given ?? 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Coupons (Sprint 123): discount codes kept in Stripe — a coupon (the
// discount) plus its promotion code (what the customer types). Accepted at
// the checkout of plans, Workspaces and bundles. Limiting one to some plans
// or products uses their own Stripe products (plans: provider_prices,
// made when the plan is saved; products: portal.provider_products, Portal
// migration 0059, made at checkout or here) — Sprint 124.
// ---------------------------------------------------------------------------
function stripeAdmin() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new HttpError(503, 'Stripe isn’t configured on this site.')
  return new Stripe(key)
}

const COUPON_CODE = /^[A-Za-z0-9-]{3,40}$/

async function planProducts(db: Db) {
  const { data, error } = await db.from('membership_plans').select('id, name, provider_prices, is_free, price_on_request').order('rank')
  if (error) {
    if (notReady(error)) return []
    throw error
  }
  return ((data ?? []) as { id: string; name: string; provider_prices: any; is_free: boolean; price_on_request: boolean }[])
    .filter((p) => !p.is_free && !p.price_on_request)
    .map((p) => ({ id: p.id, name: p.name, product: (p.provider_prices?.stripe?.product as string | undefined) ?? null }))
}

// What a coupon can be limited to besides plans: everything sold one by one
// and bundles (published).
async function couponItems(db: Db) {
  const { data, error } = await db
    .from('products')
    .select('id, name, content_type, is_free')
    .in('content_type', [...SELLABLE_TYPES, 'bundle'])
    .eq('status', 'published')
    .order('name')
  if (error) throw error
  return ((data ?? []) as { id: string; name: string; content_type: string; is_free: boolean }[])
    .filter((p) => !p.is_free)
    .map((p) => ({ id: p.id, name: p.name, kind: p.content_type }))
}

// A product's own Stripe product — same rule as stripeProductFor() in
// api/studio-checkout.ts (Portal migration 0059, portal.provider_products).
async function stripeProductForItem(stripe: Stripe, db: Db, productId: string) {
  const { data: row, error } = await db.from('provider_products').select('external_id').eq('product_id', productId).eq('provider', 'stripe').maybeSingle()
  if (error) {
    if (notReady(error)) throw new HttpError(409, 'Run the database update (Portal migration 0059) first.')
    throw error
  }
  if (row) return row.external_id as string
  const { data: p, error: pError } = await db
    .from('products')
    .select('id, name, short_description, cover_image_url, stripe_price_id')
    .eq('id', productId)
    .maybeSingle()
  if (pError) throw pError
  if (!p) throw new HttpError(404, 'Product not found.')
  let id: string
  if (p.stripe_price_id) {
    const price = await stripe.prices.retrieve(p.stripe_price_id)
    id = typeof price.product === 'string' ? price.product : price.product.id
  } else {
    id = (
      await stripe.products.create({
        name: p.name,
        ...(p.short_description ? { description: String(p.short_description).slice(0, 500) } : {}),
        ...(p.cover_image_url ? { images: [p.cover_image_url] } : {}),
        metadata: { product_id: p.id },
      })
    ).id
  }
  const { error: upError } = await db.from('provider_products').upsert({ product_id: p.id, provider: 'stripe', external_id: id, name: p.name })
  if (upError) throw upError
  return id
}

async function listCoupons(db: Db) {
  const stripe = stripeAdmin()
  const linked = await db.from('provider_products').select('external_id, name').eq('provider', 'stripe')
  const itemByProduct = new Map(((linked.data ?? []) as { external_id: string; name: string }[]).map((r) => [r.external_id, r.name]))
  const [codes, plans, items] = await Promise.all([
    stripe.promotionCodes
      .list({ limit: 100, expand: ['data.promotion.coupon.applies_to'] })
      .autoPagingToArray({ limit: 500 })
      // Fallback without the "applies to" detail if Stripe refuses that expansion.
      .catch(() => stripe.promotionCodes.list({ limit: 100, expand: ['data.promotion.coupon'] }).autoPagingToArray({ limit: 500 })),
    planProducts(db),
    couponItems(db),
  ])
  const planByProduct = new Map(plans.filter((p) => p.product).map((p) => [p.product as string, p.name]))
  return {
    plans,
    items,
    coupons: codes.map((c) => {
      const coupon = c.promotion?.coupon && typeof c.promotion.coupon !== 'string' ? c.promotion.coupon : null
      const products = coupon?.applies_to?.products ?? []
      return {
        id: c.id,
        code: c.code,
        active: c.active && (coupon?.valid ?? true),
        createdAt: new Date(c.created * 1000).toISOString(),
        expiresAt: c.expires_at ? new Date(c.expires_at * 1000).toISOString() : null,
        maxRedemptions: c.max_redemptions,
        timesRedeemed: c.times_redeemed,
        firstTimeOnly: c.restrictions?.first_time_transaction ?? false,
        percentOff: coupon?.percent_off ?? null,
        amountOffCents: coupon?.amount_off ?? null,
        duration: coupon?.duration ?? 'once',
        durationInMonths: coupon?.duration_in_months ?? null,
        appliesTo: products.length ? products.map((p) => planByProduct.get(p) ?? itemByProduct.get(p) ?? 'Other product') : null,
        name: coupon?.name ?? null,
      }
    }),
  }
}

async function createCoupon(req: VercelRequest, db: Db) {
  const b = (req.body ?? {}) as Record<string, any>
  const stripe = stripeAdmin()
  const code = str(b.code).toUpperCase()
  if (!COUPON_CODE.test(code)) throw new HttpError(400, 'Code: 3 to 40 letters, numbers or dashes (no spaces).')
  const value = Number(b.value)
  const percent = b.kind !== 'amount'
  if (!Number.isFinite(value) || value <= 0 || (percent && value > 100)) throw new HttpError(400, percent ? 'Discount: 1 to 100%.' : 'Discount: enter an amount in dollars.')
  const duration = b.duration === 'forever' ? 'forever' : b.duration === 'repeating' ? 'repeating' : 'once'
  const months = Math.round(Number(b.months))
  if (duration === 'repeating' && (!Number.isFinite(months) || months < 1 || months > 36)) throw new HttpError(400, 'Months: 1 to 36.')
  // Limited to some plans and/or products: each needs its Stripe product
  // (made now when missing).
  const products: string[] = []
  if (Array.isArray(b.planIds) && b.planIds.length) {
    const { data: rows, error } = await db.from('membership_plans').select('*').in('id', b.planIds.filter(isUuid))
    if (error) throw error
    for (const plan of (rows ?? []) as Record<string, any>[]) {
      if (!plan.provider_prices?.stripe?.product) await ensurePlanProduct(db, plan)
      const { data: fresh } = await db.from('membership_plans').select('provider_prices').eq('id', plan.id).single()
      const product = (fresh?.provider_prices as any)?.stripe?.product
      if (!product) throw new HttpError(502, `Couldn’t set up “${plan.name}” in Stripe. Try again.`)
      products.push(product)
    }
  }
  if (Array.isArray(b.productIds) && b.productIds.length) {
    for (const id of b.productIds.filter(isUuid).slice(0, 100)) products.push(await stripeProductForItem(stripe, db, id))
  }
  if ((b.planIds?.length || b.productIds?.length) && !products.length) throw new HttpError(400, 'Choose what the coupon applies to.')
  const maxRedemptions = b.maxRedemptions ? Math.round(Number(b.maxRedemptions)) : null
  if (maxRedemptions !== null && (!Number.isFinite(maxRedemptions) || maxRedemptions < 1)) throw new HttpError(400, 'Uses: a number of 1 or more, or empty for no limit.')
  const expires = futureDate(b.expiresAt, 'Expiry date')

  const existing = await stripe.promotionCodes.list({ code, active: true, limit: 1 })
  if (existing.data.length) throw new HttpError(409, `The code ${code} already exists.`)

  const coupon = await stripe.coupons.create({
    name: cleanText(b.name, 40) || code,
    ...(percent ? { percent_off: value } : { amount_off: Math.round(value * 100), currency: 'usd' }),
    duration,
    ...(duration === 'repeating' ? { duration_in_months: months } : {}),
    ...(products.length ? { applies_to: { products } } : {}),
    metadata: { created_in: 'bgrowth-admin' },
  })
  const promo = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code,
    ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
    ...(expires ? { expires_at: Math.floor(Date.parse(expires) / 1000) } : {}),
    ...(b.firstTimeOnly === true ? { restrictions: { first_time_transaction: true } } : {}),
  })
  return { coupon: { id: promo.id, code: promo.code } }
}

async function setCouponActive(req: VercelRequest) {
  const id = str(req.body?.id)
  if (!id.startsWith('promo_')) throw new HttpError(400, 'Which coupon?')
  const promo = await stripeAdmin().promotionCodes.update(id, { active: req.body?.active === true })
  return { coupon: { id: promo.id, code: promo.code, active: promo.active } }
}

// ---------------------------------------------------------------------------
// Activity log (portal.admin_activity, Portal migration 0042): every change
// made in the Admin area — who, what, when, on which member or product.
// Recorded by the router below after the change succeeds; best effort, so a
// logging problem never undoes the change itself.
// ---------------------------------------------------------------------------
type Body = Record<string, unknown>
type Described = { area: string; summary: string } | null

const fmtDay = (iso: unknown) =>
  typeof iso === 'string' && iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

// What each change means, in words. null = not recorded (drafts of a
// preview, image uploads, a grant that only returned a warning).
function describe(key: string, b: Body, r: Record<string, any>): Described {
  switch (key) {
    case 'POST confirmation':
      return { area: 'members', summary: 'Resent the confirmation e-mail' }
    case 'POST unconfirmed-cleanup':
      return { area: 'members', summary: `Deleted ${r.deleted ?? 0} account(s) never confirmed after ${r.days ?? UNCONFIRMED_DAYS} days` }
    case 'POST grants':
      if (r.requiresConfirmation) return null
      return {
        area: 'members',
        summary: `Gave access to ${b.scope === 'all' ? 'all Workspaces' : 'a Workspace'}${b.expiresAt ? ` until ${fmtDay(b.expiresAt)}` : ' with no end date'}${b.note ? ` — “${String(b.note).slice(0, 120)}”` : ''}`,
      }
    case 'PATCH grants':
      return { area: 'members', summary: 'Revoked access given by the team' }
    case 'POST licenses':
      return { area: 'members', summary: 'Gave the Workspace for good (license)' }
    case 'PATCH licenses':
      return {
        area: 'members',
        summary: b.action === 'extend' ? `Extended access until ${fmtDay(b.expiresAt)}` : b.action === 'end' ? 'Ended access now' : 'Restored access',
      }
    case 'POST support-reply':
      return { area: 'support', summary: 'Replied to a support conversation' }
    case 'PATCH support-status':
      return { area: 'support', summary: b.status === 'closed' ? 'Closed a support conversation' : 'Reopened a support conversation' }
    case 'PUT support-hours':
      return { area: 'support', summary: 'Changed the support hours' }
    case 'POST categories':
      return { area: 'catalog', summary: `Created the category “${b.name}”` }
    case 'PATCH categories':
      return { area: 'catalog', summary: `Edited the category “${r.category?.name ?? b.name ?? ''}”` }
    case 'DELETE categories':
      return { area: 'catalog', summary: 'Deleted a category' }
    case 'PATCH product-category':
      return { area: 'catalog', summary: 'Changed a Workspace’s category' }
    case 'POST bundles':
      return { area: 'catalog', summary: `Created the bundle “${b.name}”${b.status === 'published' ? ' and published it' : ' as a draft'}` }
    case 'PATCH bundles':
      return { area: 'catalog', summary: `Edited the bundle “${b.name}”${b.status === 'published' ? '' : ' (draft)'}` }
    case 'DELETE bundles':
      return { area: 'catalog', summary: 'Removed a bundle from the site' }
    case 'POST member-pages':
      return { area: 'pages', summary: `Created the page bgrowth.app/p/${b.slug}${b.status === 'published' ? ' and published it' : ' as a draft'}` }
    case 'PATCH member-pages':
      return { area: 'pages', summary: `Edited the page bgrowth.app/p/${r.page?.slug ?? b.slug}${b.status === 'published' ? '' : ' (draft)'}` }
    case 'DELETE member-page-signups':
      return { area: 'pages', summary: 'Removed a contact from a page’s e-mail list' }
    case 'DELETE member-pages':
      return { area: 'pages', summary: `Deleted the page of ${r.deleted?.display_name ?? 'a member'} (bgrowth.app/p/${r.deleted?.slug ?? ''})` }
    case 'POST tags':
      return { area: 'catalog', summary: `Created the tag “${r.tag?.name ?? b.name}”` }
    case 'PATCH tags':
      return { area: 'catalog', summary: `Renamed a tag to “${r.tag?.name ?? b.name}”` }
    case 'DELETE tags':
      return { area: 'catalog', summary: `Deleted the tag “${r.deleted?.name ?? ''}”` }
    case 'POST tags-merge':
      return { area: 'catalog', summary: `Merged the tag “${r.merged?.from}” into “${r.merged?.into}”` }
    case 'PUT product-tags':
      return { area: 'catalog', summary: `Set the tags of “${r.productName || 'a product'}”` }
    case 'PUT page-open':
      return {
        area: 'pages',
        summary: r.open ? `Made bgrowth.app/p/${r.page?.slug} public before launch` : `Took bgrowth.app/p/${r.page?.slug} back behind "Coming soon"`,
      }
    case 'PUT site-open':
      return { area: 'site', summary: r.open ? 'Opened the site to everyone' : 'Closed the site (Coming soon for visitors)' }
    case 'POST announcements':
      return { area: 'site', summary: `Created the announcement “${b.title}”` }
    case 'PATCH announcements':
      return { area: 'site', summary: `Edited the announcement “${r.announcement?.title ?? b.title}”` }
    case 'DELETE announcements':
      return { area: 'site', summary: `Deleted the announcement “${r.deleted?.title ?? ''}”` }
    case 'PUT site-content':
      return { area: 'site', summary: `Edited “${r.title ?? r.key}” (Admin → Site)` }
    case 'DELETE site-content':
      return { area: 'site', summary: `Restored the original text of “${r.title ?? r.key}”` }
    case 'PUT home-featured':
      return { area: 'site', summary: r.featured?.length ? `Set the Home highlights (${r.featured.length} products)` : 'Cleared the Home highlights' }
    case 'POST newsletter-campaign':
      return { area: 'newsletter', summary: `Saved the newsletter “${String(b.subject ?? '').slice(0, 120)}”` }
    case 'DELETE newsletter-campaign':
      return { area: 'newsletter', summary: 'Deleted a newsletter draft' }
    case 'POST newsletter-launch':
      return { area: 'newsletter', summary: 'Started a launch announcement' }
    case 'POST newsletter-test':
      return { area: 'newsletter', summary: 'Sent a newsletter test to themselves' }
    case 'POST newsletter-send':
      return { area: 'newsletter', summary: `Sent a newsletter to ${r.sent ?? 0} subscribers` }
    case 'PUT newsletter-address':
      return { area: 'newsletter', summary: 'Changed the newsletter mailing address' }
    case 'PATCH wix-contacts':
      return { area: 'newsletter', summary: `Moved the Wix contact ${r.contact?.email ?? ''} to “${b.grp}”` }
    case 'POST wix-contacts-test':
      return { area: 'newsletter', summary: 'Sent the Wix contacts invite as a test to themselves' }
    case 'POST wix-contacts-invite':
      return { area: 'newsletter', summary: `Sent the one-time invite to ${r.sent ?? 0} Wix contact(s)` }
    case 'POST deletion-complete':
      return { area: 'deletions', summary: 'Deleted a member’s account and data' }
    case 'POST deletion-reject':
      return { area: 'deletions', summary: 'Declined an account deletion request' }
    case 'DELETE reviews':
      return { area: 'reviews', summary: 'Removed a review' }
    case 'POST plans':
      return { area: 'plans', summary: `Created the plan “${b.name}”` }
    case 'PATCH plans':
      return { area: 'plans', summary: `Edited the plan “${b.name}”${b.status === 'disabled' ? ' (disabled)' : b.status === 'hidden' ? ' (hidden)' : ''}` }
    case 'PUT plan-settings':
      return { area: 'plans', summary: 'Changed the plan settings' }
    case 'POST member-plans':
      return {
        area: 'plans',
        summary: `Gave the plan “${r.planName}”${b.endsAt ? ` until ${fmtDay(b.endsAt)}` : ' with no end date'} (${String(b.reason ?? 'other')})`,
      }
    case 'PATCH member-plans':
      return { area: 'plans', summary: b.action === 'end' ? `Ended the plan “${r.planName}” given by the team` : `Changed the end date of the plan “${r.planName}”${b.endsAt ? ` to ${fmtDay(b.endsAt)}` : ' (no end date)'}` }
    case 'PUT plan-products': {
      const what = r.count === 1 ? `“${r.names?.[0] ?? 'a product'}”` : `${r.count} products`
      return { area: 'plans', summary: r.planName ? `Included ${what} in the ${r.planName} plan and above` : `Took ${what} out of the plans` }
    }
    case 'POST coupons':
      return { area: 'plans', summary: `Created the coupon ${r.coupon?.code ?? ''} (${b.kind === 'amount' ? `$${b.value} off` : `${b.value}% off`})` }
    case 'PATCH coupons':
      return { area: 'plans', summary: `${r.coupon?.active ? 'Turned on' : 'Turned off'} the coupon ${r.coupon?.code ?? ''}` }
    case 'POST team':
      return { area: 'team', summary: `Added ${r.member?.email ?? b.email} to the team as ${b.role === 'support' ? 'Support' : 'Admin'}` }
    case 'PATCH team':
      return { area: 'team', summary: `Changed ${r.email ?? 'a team member'} to ${b.role === 'support' ? 'Support' : 'Admin'}` }
    case 'DELETE team':
      return { area: 'team', summary: `Removed ${r.email ?? 'a team member'} from the team` }
    default:
      return null
  }
}

// Only short, plain values from the request — never message bodies,
// e-mail HTML, images or confirmations typed by the admin.
const SKIP_DETAILS = new Set(['body', 'bodyHtml', 'dataUrl', 'confirmEmail', 'longDescription', 'preheader', 'bio'])
function details(b: Body, query: VercelRequest['query']) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(b ?? {})) {
    if (SKIP_DETAILS.has(k)) continue
    if (typeof v === 'string') out[k] = v.slice(0, 200)
    else if (typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v
    else if (Array.isArray(v) && v.length <= 20 && v.every((x) => typeof x === 'string')) out[k] = v
  }
  if (typeof query.id === 'string' && !out.id) out.id = query.id
  return out
}

const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)

async function recordActivity(db: Db, admin: Admin, key: string, req: VercelRequest, result: Record<string, any>) {
  const b = (req.body && typeof req.body === 'object' ? req.body : {}) as Body
  const described = describe(key, b, result)
  if (!described) return
  const row = result.grant ?? result.license ?? result.memberPlan ?? {}
  // A deleted account keeps no link back to the person.
  const userId = key === 'POST deletion-complete' ? null : b.userId ?? row.user_id ?? null
  const productId = b.productId ?? row.product_id ?? (key.endsWith(' bundles') ? result.bundle?.id ?? b.id ?? req.query.id : null)
  try {
    const { error } = await db.from('admin_activity').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: key,
      area: described.area,
      summary: described.summary,
      target_user_id: isUuid(userId) ? userId : null,
      target_product_id: isUuid(productId) ? productId : null,
      details: details(b, req.query),
    })
    if (error) console.error('[admin] activity not recorded:', error.message)
  } catch (err) {
    console.error('[admin] activity not recorded:', err)
  }
}

async function listActivity(req: VercelRequest, db: Db) {
  const page = Math.max(1, Number(req.query.page) || 1)
  const size = 50
  let query = db
    .from('admin_activity')
    .select('id, created_at, admin_id, admin_email, action, area, summary, target_user_id, target_product_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * size, page * size - 1)
  const area = str(req.query.area)
  const who = str(req.query.admin)
  const member = str(req.query.member)
  if (area) query = query.eq('area', area)
  if (isUuid(who)) query = query.eq('admin_id', who)
  if (isUuid(member)) query = query.eq('target_user_id', member)
  const { data, error, count } = await query
  if (error) {
    if ((error as { code?: string }).code === '42P01' || (error as { code?: string }).code === 'PGRST205') {
      return { entries: [], total: 0, page, pageSize: size, admins: [], ready: false }
    }
    throw error
  }
  type Entry = { id: string; created_at: string; admin_id: string | null; admin_email: string; action: string; area: string; summary: string; target_user_id: string | null; target_product_id: string | null }
  const rows = (data ?? []) as Entry[]
  const userIds = [...new Set(rows.flatMap((r) => (r.target_user_id ? [r.target_user_id] : [])))]
  const productIds = [...new Set(rows.flatMap((r) => (r.target_product_id ? [r.target_product_id] : [])))]
  const [users, products, team] = await Promise.all([
    userIds.length ? db.from('users').select('id, email').in('id', userIds) : Promise.resolve({ data: [], error: null }),
    productIds.length ? db.from('products').select('id, name').in('id', productIds) : Promise.resolve({ data: [], error: null }),
    db.from('website_admins').select('user_id, email'),
  ])
  const emailById = new Map(((users.data ?? []) as { id: string; email: string }[]).map((u) => [u.id, u.email]))
  const nameById = new Map(((products.data ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]))
  return {
    entries: rows.map((r) => ({
      ...r,
      target_user_email: r.target_user_id ? emailById.get(r.target_user_id) ?? null : null,
      target_product_name: r.target_product_id ? nameById.get(r.target_product_id) ?? null : null,
    })),
    total: count ?? rows.length,
    page,
    pageSize: size,
    admins: ((team.data ?? []) as { user_id: string; email: string }[]).map((t) => ({ id: t.user_id, email: t.email })),
    ready: true,
  }
}

// ---------------------------------------------------------------------------
// Router. Each `METHOD resource` runs one function; Support (role 'support')
// may use only SUPPORT_ACTIONS — everything else is for Admins. Changes
// (anything but GET) are written to the activity log once they succeed.
// ---------------------------------------------------------------------------
type Route = (req: VercelRequest, db: Db, admin: Admin) => Promise<Record<string, any>>

const ROUTES: Record<string, Route> = {
  'GET me': async (_req, _db, admin) => ({ admin }),
  'GET members': (req, db) => listMembers(req, db),
  'GET member': (req, db) => getMember(req, db),
  'POST confirmation': (req, db) => resendConfirmation(req, db),
  'GET unconfirmed': (req, db) => listUnconfirmed(req, db),
  'POST unconfirmed-cleanup': (req, db) => deleteUnconfirmed(req, db),
  'GET support': (req, db) => listSupport(req, db),
  'GET support-waiting': async (_req, db, admin) => {
    const counts = await countSupportWaiting(db)
    return admin.role === 'admin' ? counts : { ...counts, deletionsPending: 0 }
  },
  'GET support-thread': (req, db) => getSupportThread(req, db),
  'POST support-reply': (req, db, admin) => replySupport(req, db, admin),
  'PATCH support-status': (req, db) => setSupportStatus(req, db),
  'PUT support-hours': (req, db, admin) => saveSupportHours(req, db, admin),
  'GET categories': (_req, db) => listCatalogCategories(db),
  'POST categories': (req, db) => createCategory(req, db),
  'PATCH categories': (req, db) => updateCategory(req, db),
  'DELETE categories': (req, db) => deleteCategory(req, db),
  'PATCH product-category': (req, db) => setProductCategory(req, db),
  'GET sales': (_req, db) => listSales(db),
  'GET products': (_req, db) => listProducts(db),
  'POST grants': (req, db, admin) => createGrant(req, db, admin),
  'PATCH grants': (req, db) => revokeGrant(req, db),
  'POST licenses': (req, db) => giveLicense(req, db),
  'PATCH licenses': (req, db) => updateLicense(req, db),
  'GET newsletter': (_req, db) => newsletterOverview(db),
  'GET newsletter-campaign': (req, db) => getCampaign(req, db),
  'POST newsletter-campaign': (req, db, admin) => saveCampaign(req, db, admin),
  'DELETE newsletter-campaign': (req, db) => deleteCampaign(req, db),
  'POST newsletter-launch': (req, db, admin) => createLaunchCampaign(req, db, admin),
  'POST newsletter-image': (req, db) => uploadNewsletterImage(req, db),
  'POST newsletter-preview': (req, db) => previewCampaign(req, db),
  'GET newsletter-audience': (req, db) => countAudience(req, db),
  'POST newsletter-test': (req, db, admin) => sendCampaignTest(req, db, admin),
  'POST newsletter-send': (req, db) => sendCampaign(req, db),
  'PUT newsletter-address': (req, db, admin) => saveNewsletterAddress(req, db, admin),
  'GET wix-contacts': (_req, db) => listWixContacts(db),
  'PATCH wix-contacts': (req, db) => updateWixContact(req, db),
  'POST wix-contacts-test': (req, db, admin) => sendWixInviteTest(req, db, admin),
  'POST wix-contacts-invite': (req, db) => sendWixInvites(req, db),
  'GET dashboard-members': (req, db) => memberDashboard(req, db),
  'GET catalog-health': (_req, db) => catalogHealth(db),
  'GET deletion-requests': (_req, db) => listDeletionRequests(db),
  'POST deletion-complete': (req, db, admin) => completeDeletion(req, db, admin),
  'POST deletion-reject': (req, db, admin) => rejectDeletion(req, db, admin),
  'GET reviews': (_req, db) => listReviews(db),
  'DELETE reviews': (req, db) => deleteReview(req, db),
  'GET bundles': (_req, db) => listBundles(db),
  'POST bundles': (req, db, admin) => createBundle(req, db, admin),
  'PATCH bundles': (req, db, admin) => updateBundle(req, db, admin),
  'DELETE bundles': (req, db) => archiveBundle(req, db),
  'GET member-pages': (_req, db) => listMemberPages(db),
  'GET member-page-stats': (req, db) => memberPageStats(req, db),
  'GET member-page-signups': (req, db) => memberPageSignups(req, db),
  'DELETE member-page-signups': (req, db) => memberPageSignups(req, db),
  'POST member-pages': (req, db) => createMemberPage(req, db),
  'PATCH member-pages': (req, db) => updateMemberPage(req, db),
  'DELETE member-pages': (req, db) => deleteMemberPage(req, db),
  'GET tags': (_req, db) => listTags(db),
  'POST tags': (req, db) => createTag(req, db),
  'PATCH tags': (req, db) => renameTag(req, db),
  'DELETE tags': (req, db) => deleteTag(req, db),
  'POST tags-merge': (req, db) => mergeTags(req, db),
  'PUT product-tags': (req, db) => setProductTags(req, db),
  'GET site': (_req, db) => siteOverview(db),
  'PUT site-open': (req, db, admin) => setSiteOpen(req, db, admin),
  'PUT page-open': (req, db, admin) => setPageOpen(req, db, admin),
  'POST announcements': (req, db, admin) => createAnnouncement(req, db, admin),
  'PATCH announcements': (req, db) => updateAnnouncement(req, db),
  'DELETE announcements': (req, db) => deleteAnnouncement(req, db),
  'PUT home-featured': (req, db) => saveHomeFeatured(req, db),
  'GET site-content': (req, db) => getSiteContent(req, db),
  'PUT site-content': (req, db, admin) => saveSiteContent(req, db, admin),
  'DELETE site-content': (req, db) => resetSiteContent(req, db),
  'GET plans': (_req, db) => listPlans(db),
  'POST plans': (req, db) => createPlan(req, db),
  'PATCH plans': (req, db) => updatePlan(req, db),
  'PUT plan-settings': (req, db, admin) => savePlanSettings(req, db, admin),
  'GET plan-subscribers': (_req, db) => listPlanSubscribers(db),
  'GET plan-products': (_req, db) => listPlanProducts(db),
  'PUT plan-products': (req, db) => setPlanProduct(req, db),
  'GET coupons': (_req, db) => listCoupons(db),
  'POST coupons': (req, db) => createCoupon(req, db),
  'PATCH coupons': (req) => setCouponActive(req),
  'GET member-plans': (req, db) => listMemberPlans(req, db),
  'POST member-plans': (req, db, admin) => giveMemberPlan(req, db, admin),
  'PATCH member-plans': (req, db) => changeMemberPlan(req, db),
  'GET team': (_req, db) => listTeam(db),
  'POST team': (req, db) => addTeamMember(req, db),
  'PATCH team': (req, db, admin) => updateTeamMember(req, db, admin),
  'DELETE team': (req, db, admin) => removeTeamMember(req, db, admin),
  'GET activity': (req, db) => listActivity(req, db),
}

// What the Support role may do (decided 10/10/2026): answer support, see
// members and their documents, resend the confirmation e-mail, give or
// extend access and trials (to fix a complaint quickly), and read reviews.
const SUPPORT_ACTIONS = new Set([
  'GET me',
  'GET members',
  'GET member',
  'POST confirmation',
  'GET support',
  'GET support-waiting',
  'GET support-thread',
  'POST support-reply',
  'PATCH support-status',
  'GET products',
  'POST grants',
  'PATCH grants',
  'POST licenses',
  'PATCH licenses',
  'GET reviews',
])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = client()
    const admin = await requireAdmin(req, db)
    const resource = str(req.query.resource)
    const key = `${req.method} ${resource}`
    const route = ROUTES[key]
    if (!route) return res.status(404).json({ ok: false, error: 'Unknown admin action.' })
    if (admin.role !== 'admin' && !SUPPORT_ACTIONS.has(key)) {
      return res.status(403).json({ ok: false, error: 'Only Admins can do this.' })
    }
    const result = await route(req, db, admin)
    if (req.method !== 'GET') await recordActivity(db, admin, key, req, result)
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ ok: false, error: err.message, ...err.extra })
    console.error('[admin] error:', err)
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err)
    return res.status(500).json({ ok: false, error: message })
  }
}
