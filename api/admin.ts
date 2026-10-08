import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { randomUUID } from 'node:crypto'

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

type Admin = { id: string; email: string }
type Db = SupabaseClient<any, 'portal', any>

const PAGE_SIZE = 25

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
  const { data: row, error: rowError } = await db
    .from('website_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (rowError) throw rowError
  if (!row) throw new HttpError(403, 'This area is for BGrowth administrators.')
  return { id: data.user.id, email: data.user.email ?? '' }
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
  // Waiting for the team first, then the most recent.
  const conversations = (data ?? []).sort((a, b) =>
    a.last_sender === b.last_sender ? 0 : a.last_sender === 'customer' ? -1 : 1,
  )
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
type CategoryRow = { id: string; name: string; slug: string; parent_id: string | null; sort_order: number }

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
    .select('id, name, slug, parent_id, sort_order')
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
  if (Object.keys(patch).length === 0) throw new HttpError(400, 'Nothing to change.')
  const { data, error } = await db
    .from('workspace_categories')
    .update(patch)
    .eq('id', id)
    .select('id, name, slug, parent_id, sort_order')
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
    .select('id, name, slug, short_description, cover_image_url, category_id, status')
    .eq('id', productId)
    .maybeSingle()
  if (error) throw error
  if (!product || product.status !== 'published') throw new HttpError(404, 'Choose a published Workspace.')
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
  const path = `newsletter/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`
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
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = client()
    const admin = await requireAdmin(req, db)
    const resource = str(req.query.resource)
    const key = `${req.method} ${resource}`

    switch (key) {
      case 'GET me':
        return res.status(200).json({ ok: true, admin })
      case 'GET members':
        return res.status(200).json({ ok: true, ...(await listMembers(req, db)) })
      case 'GET member':
        return res.status(200).json({ ok: true, ...(await getMember(req, db)) })
      case 'POST confirmation':
        return res.status(200).json({ ok: true, ...(await resendConfirmation(req, db)) })
      case 'GET support':
        return res.status(200).json({ ok: true, ...(await listSupport(req, db)) })
      case 'GET support-waiting':
        return res.status(200).json({ ok: true, ...(await countSupportWaiting(db)) })
      case 'GET support-thread':
        return res.status(200).json({ ok: true, ...(await getSupportThread(req, db)) })
      case 'POST support-reply':
        return res.status(200).json({ ok: true, ...(await replySupport(req, db, admin)) })
      case 'PATCH support-status':
        return res.status(200).json({ ok: true, ...(await setSupportStatus(req, db)) })
      case 'PUT support-hours':
        return res.status(200).json({ ok: true, ...(await saveSupportHours(req, db, admin)) })
      case 'GET categories':
        return res.status(200).json({ ok: true, ...(await listCatalogCategories(db)) })
      case 'POST categories':
        return res.status(200).json({ ok: true, ...(await createCategory(req, db)) })
      case 'PATCH categories':
        return res.status(200).json({ ok: true, ...(await updateCategory(req, db)) })
      case 'DELETE categories':
        return res.status(200).json({ ok: true, ...(await deleteCategory(req, db)) })
      case 'PATCH product-category':
        return res.status(200).json({ ok: true, ...(await setProductCategory(req, db)) })
      case 'GET sales':
        return res.status(200).json({ ok: true, ...(await listSales(db)) })
      case 'GET products':
        return res.status(200).json({ ok: true, ...(await listProducts(db)) })
      case 'POST grants':
        return res.status(200).json({ ok: true, ...(await createGrant(req, db, admin)) })
      case 'PATCH grants':
        return res.status(200).json({ ok: true, ...(await revokeGrant(req, db)) })
      case 'POST licenses':
        return res.status(200).json({ ok: true, ...(await giveLicense(req, db)) })
      case 'PATCH licenses':
        return res.status(200).json({ ok: true, ...(await updateLicense(req, db)) })
      case 'GET newsletter':
        return res.status(200).json({ ok: true, ...(await newsletterOverview(db)) })
      case 'GET newsletter-campaign':
        return res.status(200).json({ ok: true, ...(await getCampaign(req, db)) })
      case 'POST newsletter-campaign':
        return res.status(200).json({ ok: true, ...(await saveCampaign(req, db, admin)) })
      case 'DELETE newsletter-campaign':
        return res.status(200).json({ ok: true, ...(await deleteCampaign(req, db)) })
      case 'POST newsletter-launch':
        return res.status(200).json({ ok: true, ...(await createLaunchCampaign(req, db, admin)) })
      case 'POST newsletter-image':
        return res.status(200).json({ ok: true, ...(await uploadNewsletterImage(req, db)) })
      case 'POST newsletter-preview':
        return res.status(200).json({ ok: true, ...(await previewCampaign(req, db)) })
      case 'GET newsletter-audience':
        return res.status(200).json({ ok: true, ...(await countAudience(req, db)) })
      case 'POST newsletter-test':
        return res.status(200).json({ ok: true, ...(await sendCampaignTest(req, db, admin)) })
      case 'POST newsletter-send':
        return res.status(200).json({ ok: true, ...(await sendCampaign(req, db)) })
      case 'PUT newsletter-address':
        return res.status(200).json({ ok: true, ...(await saveNewsletterAddress(req, db, admin)) })
      case 'GET dashboard-members':
        return res.status(200).json({ ok: true, ...(await memberDashboard(req, db)) })
      case 'GET deletion-requests':
        return res.status(200).json({ ok: true, ...(await listDeletionRequests(db)) })
      case 'POST deletion-complete':
        return res.status(200).json({ ok: true, ...(await completeDeletion(req, db, admin)) })
      case 'POST deletion-reject':
        return res.status(200).json({ ok: true, ...(await rejectDeletion(req, db, admin)) })
      case 'GET reviews':
        return res.status(200).json({ ok: true, ...(await listReviews(db)) })
      case 'DELETE reviews':
        return res.status(200).json({ ok: true, ...(await deleteReview(req, db)) })
      default:
        return res.status(404).json({ ok: false, error: 'Unknown admin action.' })
    }
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ ok: false, error: err.message, ...err.extra })
    console.error('[admin] error:', err)
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err)
    return res.status(500).json({ ok: false, error: message })
  }
}
