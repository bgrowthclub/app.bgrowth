import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

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
    .select('id, name, slug, is_free, price_cents, currency, status')
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
  return { waiting: count ?? 0 }
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
