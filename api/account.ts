import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// A member's own account requests (Sprint 65). For now: asking to delete
// the account and all its data, checking that request, and cancelling it
// while it's still pending. The team reviews and completes it in Admin →
// Deletions (api/admin.ts); nothing is deleted here.
//
//   GET    ?resource=deletion  → the member's latest request (or null)
//   POST   ?resource=deletion  { reason?, source? } → new pending request
//   DELETE ?resource=deletion  → cancel the pending request
//   POST   ?resource=announcements-seen → the member opened the bell
//          (portal.users.announcements_seen_at, Portal migration 0046)
//   GET    ?resource=download&product=<id>&file=<id> → a 2-minute link to
//          one file of a Download (content_type 'pdf') the member has
//          access to — the files sit in the private library-files bucket
//          (Portal migration 0049)
//   GET    ?resource=purchases → Account → Purchases (Sprint 119): the
//          member's paid orders (read from Stripe by their e-mail — Website
//          and Portal sell through the same account; receipt link when
//          Stripe has one) and every access on their account (licenses and
//          team grants), each with where it came from. Nothing is invented:
//          an access with no payment or team record says so.
//
//   POST   ?resource=plan-checkout | plan-switch | plan-cancel | plan-resume |
//          plan-portal → the member's plan subscription (Sprint 122, see the
//          Plans section below)
//
// Called from the Website's Settings and the Portal's Profile (CORS below).
// Table: portal.account_deletion_requests (Portal migration 0039).
// Self-contained (no relative imports), like the other functions.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; optional RESEND_API_KEY,
// SUPPORT_FROM_EMAIL, SUPPORT_NOTIFY_EMAIL, SITE_URL.

type Db = SupabaseClient<any, 'portal', any>

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

function siteUrl(req: VercelRequest) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  return `https://${Array.isArray(host) ? host[0] : host}`
}

function allowPortal(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin ?? '')
  const ok =
    origin === 'https://portal.bgrowth.app' ||
    /^https:\/\/bgrowth-portal-[a-z0-9-]+\.vercel\.app$/.test(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin)
  if (!ok) return
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
}

// Best effort: a failed e-mail never fails the request.
async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM_EMAIL || 'BGrowth Support <support@bgrowth.app>',
        to,
        subject,
        html,
      }),
    })
    if (!res.ok) console.error('[account] e-mail failed:', res.status, await res.text())
  } catch (err) {
    console.error('[account] e-mail failed:', err)
  }
}

function layout(heading: string, body: string) {
  return `
  <div style="background:#F4F7FD;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0A1B4D">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0;font-weight:800;font-size:18px">BGrowth</p>
      <h1 style="margin:20px 0 12px;font-size:22px">${heading}</h1>
      ${body}
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6B7896">Questions? Just reply to this e-mail — it goes to our support team.</p>
    </div>
  </div>`
}

const p = (text: string) => `<p style="margin:0 0 14px;line-height:1.6;color:#33406B">${text}</p>`

async function signedInUser(req: VercelRequest, db: Db) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new HttpError(401, 'Sign in to continue.')
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Sign in to continue.')
  return data.user
}

const COLUMNS = 'id, status, reason, source, requested_at, decided_at, admin_note'

// ---------------------------------------------------------------------------
// Account → Purchases (Sprint 119)
// ---------------------------------------------------------------------------
type ProductRow = { id: string; slug: string; name: string; content_type: string; is_free: boolean }

interface Order {
  id: string
  createdAt: string
  amount: number
  currency: string
  refunded: number | null
  status: 'paid' | 'refunded' | 'partly_refunded' | 'pending'
  productSlug: string | null
  productName: string | null
  isBundle: boolean
  receiptUrl: string | null
}

interface Access {
  id: string
  kind: 'purchase' | 'free' | 'trial' | 'team' | 'other'
  productName: string
  productSlug: string | null
  // Where it came from, in words: the order, "Free product", "Given by the BGrowth team"...
  origin: string
  startedAt: string | null
  endsAt: string | null
  status: 'active' | 'expired' | 'cancelled'
}

async function stripeOrders(email: string, userId: string): Promise<{ orders: Order[]; available: boolean }> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || !email) return { orders: [], available: false }
  const stripe = new Stripe(key)
  try {
    const sessions = await stripe.checkout.sessions
      .list({ customer_details: { email }, status: 'complete', limit: 100, expand: ['data.payment_intent.latest_charge'] })
      .autoPagingToArray({ limit: 500 })
    // Also the member's own sessions under an e-mail they changed since (metadata.userId).
    const mine = sessions.filter((s) => !s.metadata?.userId || s.metadata.userId === userId || s.client_reference_id === userId)
    const orders = mine
      // Plan subscriptions are shown in Account → Membership (invoices in Stripe's billing page).
      .filter((s) => (s.amount_total ?? 0) > 0 && s.mode !== 'subscription')
      .map((s): Order => {
        const pi = s.payment_intent && typeof s.payment_intent !== 'string' ? s.payment_intent : null
        const charge = pi?.latest_charge && typeof pi.latest_charge !== 'string' ? pi.latest_charge : null
        const amount = s.amount_total ?? 0
        const refunded = charge ? charge.amount_refunded : null
        return {
          id: s.id,
          createdAt: new Date(s.created * 1000).toISOString(),
          amount,
          currency: s.currency ?? 'usd',
          refunded,
          status:
            s.payment_status !== 'paid' ? 'pending' : refunded && refunded >= amount ? 'refunded' : refunded ? 'partly_refunded' : 'paid',
          productSlug: s.metadata?.productSlug ?? null,
          productName: null,
          isBundle: false,
          receiptUrl: charge?.receipt_url ?? null,
        }
      })
    return { orders, available: true }
  } catch (err) {
    console.error('[account] purchases: Stripe read failed:', err instanceof Error ? err.message : err)
    return { orders: [], available: false }
  }
}

async function purchasesOf(db: Db, userId: string, email: string) {
  const [{ orders, available }, licensesRes, grantsRes, teamRes] = await Promise.all([
    stripeOrders(email.toLowerCase(), userId),
    db.from('licenses').select('id, product_id, type, status, access_policy, activated_at, expires_at').eq('user_id', userId),
    db.from('access_grants').select('id, scope, product_id, expires_at, created_at, revoked_at').eq('user_id', userId),
    db.from('admin_activity').select('target_product_id').eq('target_user_id', userId).eq('action', 'POST licenses'),
  ])
  if (licensesRes.error) throw licensesRes.error
  if (grantsRes.error) throw grantsRes.error
  const licenses = (licensesRes.data ?? []) as {
    id: string
    product_id: string
    type: string
    status: string
    access_policy: string
    activated_at: string | null
    expires_at: string | null
  }[]
  const grants = (grantsRes.data ?? []) as { id: string; scope: string; product_id: string | null; expires_at: string | null; created_at: string; revoked_at: string | null }[]
  const teamGiven = new Set(((teamRes.data ?? []) as { target_product_id: string | null }[]).map((r) => r.target_product_id).filter(Boolean))

  // Names for every product mentioned, and the items of every bundle bought.
  const orderSlugs = orders.map((o) => o.productSlug).filter((v): v is string => Boolean(v))
  const ids = [...licenses.map((l) => l.product_id), ...grants.map((g) => g.product_id).filter((v): v is string => Boolean(v))]
  const [bySlug, byId] = await Promise.all([
    orderSlugs.length ? db.from('products').select('id, slug, name, content_type, is_free').in('slug', orderSlugs) : { data: [] },
    ids.length ? db.from('products').select('id, slug, name, content_type, is_free').in('id', ids) : { data: [] },
  ])
  const products = new Map<string, ProductRow>()
  for (const p of [...((bySlug.data ?? []) as ProductRow[]), ...((byId.data ?? []) as ProductRow[])]) products.set(p.id, p)
  const slugToProduct = new Map([...products.values()].map((p) => [p.slug, p]))

  const orderOf = new Map<string, Order>()
  const bundleIds: string[] = []
  for (const o of orders) {
    const p = o.productSlug ? slugToProduct.get(o.productSlug) : undefined
    o.productName = p?.name ?? o.productSlug
    o.isBundle = p?.content_type === 'bundle'
    if (p && o.status !== 'refunded') {
      orderOf.set(p.id, o)
      if (o.isBundle) bundleIds.push(p.id)
    }
  }
  if (bundleIds.length) {
    const { data } = await db.from('bundle_items').select('bundle_id, product_id').in('bundle_id', bundleIds)
    for (const row of (data ?? []) as { bundle_id: string; product_id: string }[]) {
      const o = orderOf.get(row.bundle_id)
      if (o && !orderOf.has(row.product_id)) orderOf.set(row.product_id, o)
    }
  }

  const now = Date.now()
  const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')
  const accesses: Access[] = licenses.map((l) => {
    const p = products.get(l.product_id)
    const ended = l.status === 'revoked'
    const expired = l.status === 'expired' || (l.access_policy !== 'lifetime' && !!l.expires_at && new Date(l.expires_at).getTime() < now)
    const status: Access['status'] = ended ? 'cancelled' : expired ? 'expired' : 'active'
    const base = { id: l.id, productName: p?.name ?? 'A product no longer available', productSlug: p?.slug ?? null, startedAt: l.activated_at, endsAt: l.access_policy === 'lifetime' ? null : l.expires_at, status }
    if (l.type === 'trial') return { ...base, kind: 'trial', origin: 'Free trial' }
    const order = orderOf.get(l.product_id)
    if (order) {
      const via = order.isBundle && order.productName !== p?.name ? ` (part of ${order.productName})` : ''
      return { ...base, kind: 'purchase', origin: `Purchased on ${day(order.createdAt)}${via}` }
    }
    if (teamGiven.has(l.product_id)) return { ...base, kind: 'team', origin: 'Given by the BGrowth team' }
    if (p?.is_free) return { ...base, kind: 'free', origin: 'Free product' }
    return { ...base, kind: 'other', origin: 'Lifetime access on your account' }
  })
  for (const g of grants) {
    const p = g.product_id ? products.get(g.product_id) : null
    const expired = !!g.expires_at && new Date(g.expires_at).getTime() < now
    accesses.push({
      id: g.id,
      kind: 'team',
      productName: g.scope === 'all' ? 'All Workspaces' : p?.name ?? 'A product no longer available',
      productSlug: g.scope === 'all' ? null : p?.slug ?? null,
      origin: 'Given by the BGrowth team',
      startedAt: g.created_at,
      endsAt: g.expires_at,
      status: g.revoked_at ? 'cancelled' : expired ? 'expired' : 'active',
    })
  }
  accesses.sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
  return { orders, accesses, ordersAvailable: available }
}

// ---------------------------------------------------------------------------
// Plans (Sprint 122, Portal migrations 0057–0058): a member subscribes,
// switches, cancels or resumes their plan, and opens Stripe's page to change
// the card or see invoices. portal.member_plans is updated by the webhook
// (api/webhooks/stripe.ts); after a switch/cancel/resume it is also synced
// here right away so the page shows it at once.
//   POST ?resource=plan-checkout { planId, interval } → { url } (Stripe Checkout)
//   POST ?resource=plan-switch   { planId, interval }
//   POST ?resource=plan-cancel / plan-resume
//   POST ?resource=plan-portal → { url } (Stripe's billing page)
// ---------------------------------------------------------------------------
type PlanRow = {
  id: string
  slug: string
  name: string
  status: string
  is_free: boolean
  price_on_request: boolean
  currency: string
  monthly_cents: number | null
  yearly_cents: number | null
  monthly_sale_cents: number | null
  yearly_sale_cents: number | null
  provider_prices: { stripe?: { product?: string; prices?: Record<string, string> } } | null
}
type PlanSettings = { cancelAt: 'period_end' | 'now'; graceDays: number; allowSwitch: boolean }

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new HttpError(503, 'Payments aren’t set up on this site yet.')
  return new Stripe(key)
}

async function planSettings(db: Db): Promise<PlanSettings> {
  const { data } = await db.from('site_settings').select('value').eq('key', 'plans').maybeSingle()
  return { cancelAt: 'period_end', graceDays: 7, allowSwitch: true, ...((data?.value as Partial<PlanSettings> | undefined) ?? {}) }
}

async function sellablePlan(db: Db, planId: string, interval: string): Promise<{ plan: PlanRow; cents: number; interval: 'month' | 'year' }> {
  if (interval !== 'month' && interval !== 'year') throw new HttpError(400, 'Choose monthly or yearly.')
  const { data: plan, error } = await db.from('membership_plans').select('*').eq('id', planId).maybeSingle()
  if (error) throw error
  if (!plan || plan.status !== 'active') throw new HttpError(404, 'This plan isn’t available.')
  if (plan.is_free) throw new HttpError(400, 'Free needs no subscription.')
  if (plan.price_on_request) throw new HttpError(400, 'This plan is by request — talk to us through Support.')
  const cents = interval === 'year' ? plan.yearly_sale_cents ?? plan.yearly_cents : plan.monthly_sale_cents ?? plan.monthly_cents
  if (cents == null || cents < 50) throw new HttpError(400, `This plan has no ${interval === 'year' ? 'yearly' : 'monthly'} price.`)
  return { plan: plan as PlanRow, cents, interval }
}

// The Stripe price for this plan, interval and amount — created the first
// time it's needed and kept in membership_plans.provider_prices, so a new
// price (or a promotion) never changes what current subscribers pay.
async function stripePriceFor(db: Db, stripe: Stripe, plan: PlanRow, interval: 'month' | 'year', cents: number) {
  const currency = (plan.currency || 'usd').toLowerCase()
  const stored = plan.provider_prices?.stripe ?? {}
  const key = `${interval}:${currency}:${cents}`
  if (stored.prices?.[key]) return stored.prices[key]
  let product = stored.product
  if (!product) {
    product = (await stripe.products.create({ name: `BGrowth ${plan.name} plan`, metadata: { kind: 'plan', plan_id: plan.id, plan_slug: plan.slug } })).id
  }
  const price = await stripe.prices.create({
    product,
    currency,
    unit_amount: cents,
    recurring: { interval },
    metadata: { kind: 'plan', plan_id: plan.id },
  })
  const next = { ...(plan.provider_prices ?? {}), stripe: { product, prices: { ...(stored.prices ?? {}), [key]: price.id } } }
  const { error } = await db.from('membership_plans').update({ provider_prices: next }).eq('id', plan.id)
  if (error) throw error
  return price.id
}

type MemberPlanRow = { id: string; status: string; ends_at: string | null; starts_at: string; provider_subscription_id: string | null; provider_customer_id: string | null }

async function memberSubscriptions(db: Db, userId: string): Promise<MemberPlanRow[]> {
  const { data, error } = await db
    .from('member_plans')
    .select('id, status, ends_at, starts_at, provider_subscription_id, provider_customer_id')
    .eq('user_id', userId)
    .eq('source', 'subscription')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MemberPlanRow[]
}

const liveSub = (rows: MemberPlanRow[]) =>
  rows.find((r) => ['active', 'trialing', 'past_due'].includes(r.status) && (!r.ends_at || Date.parse(r.ends_at) > Date.now()))

const isoSec = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000).toISOString() : null)

// Same rule as syncSubscription() in api/webhooks/stripe.ts.
async function syncPlanSubscription(db: Db, sub: Stripe.Subscription, graceDays: number) {
  const meta = sub.metadata ?? {}
  if (meta.kind !== 'plan' || !meta.user_id || !meta.plan_id || sub.status === 'incomplete') return
  const item = sub.items.data[0]
  const periodEnd = isoSec(item?.current_period_end)
  const { data: existing } = await db.from('member_plans').select('ends_at, status').eq('provider_subscription_id', sub.id).maybeSingle()
  let status = sub.status === 'trialing' ? 'trialing' : 'active'
  let endsAt: string | null = sub.cancel_at_period_end ? periodEnd : isoSec(sub.cancel_at)
  if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
    status = 'ended'
    endsAt = isoSec(sub.ended_at) ?? isoSec(sub.canceled_at) ?? new Date().toISOString()
  } else if (sub.status === 'past_due' || sub.status === 'unpaid') {
    status = 'past_due'
    endsAt = existing?.status === 'past_due' && existing.ends_at ? existing.ends_at : new Date(Date.now() + graceDays * 86400000).toISOString()
  }
  const { error } = await db.from('member_plans').upsert(
    {
      user_id: meta.user_id,
      plan_id: meta.plan_id,
      source: 'subscription',
      status,
      billing_interval: item?.price?.recurring?.interval === 'year' ? 'year' : 'month',
      provider: 'stripe',
      provider_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      provider_subscription_id: sub.id,
      starts_at: isoSec(sub.start_date) ?? new Date().toISOString(),
      ends_at: endsAt,
      current_period_end: periodEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
      amount_cents: item?.price?.unit_amount ?? null,
      currency: item?.price?.currency ?? 'usd',
      canceled_at: isoSec(sub.canceled_at),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider_subscription_id' },
  )
  if (error) throw error
}

async function planAction(req: VercelRequest, db: Db, user: { id: string; email?: string | null }, resource: string) {
  if (req.method !== 'POST') throw new HttpError(405, 'Use POST.')
  const stripe = stripeClient()
  const settings = await planSettings(db)
  const subs = await memberSubscriptions(db, user.id)
  const live = liveSub(subs)
  const customer = subs.find((s) => s.provider_customer_id)?.provider_customer_id ?? null
  const site = siteUrl(req)

  if (resource === 'plan-checkout') {
    if (live) throw new HttpError(409, 'You already have a plan. Change it in Account → Membership.')
    const { plan, cents, interval } = await sellablePlan(db, str(req.body?.planId), str(req.body?.interval))
    const price = await stripePriceFor(db, stripe, plan, interval, cents)
    const meta = { kind: 'plan', user_id: user.id, plan_id: plan.id, interval }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      ...(customer ? { customer } : { customer_email: user.email ?? undefined }),
      client_reference_id: user.id,
      metadata: meta,
      subscription_data: { metadata: meta },
      allow_promotion_codes: true,
      success_url: `${site}/platform/membership?subscribed=1`,
      cancel_url: `${site}/pricing`,
    })
    return { url: session.url }
  }

  if (resource === 'plan-portal') {
    if (!customer) throw new HttpError(404, 'There’s no billing on your account yet.')
    const session = await stripe.billingPortal.sessions.create({ customer, return_url: `${site}/platform/membership` })
    return { url: session.url }
  }

  if (!live?.provider_subscription_id) throw new HttpError(404, 'You don’t have a paid plan right now.')
  const subId = live.provider_subscription_id

  if (resource === 'plan-switch') {
    if (!settings.allowSwitch) throw new HttpError(403, 'To change your plan, talk to us through Support.')
    const { plan, cents, interval } = await sellablePlan(db, str(req.body?.planId), str(req.body?.interval))
    const price = await stripePriceFor(db, stripe, plan, interval, cents)
    const current = await stripe.subscriptions.retrieve(subId)
    const updated = await stripe.subscriptions.update(subId, {
      items: [{ id: current.items.data[0].id, price }],
      metadata: { ...current.metadata, plan_id: plan.id, interval },
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
    })
    await syncPlanSubscription(db, updated, settings.graceDays)
    return { switched: plan.name }
  }

  if (resource === 'plan-cancel') {
    const updated =
      settings.cancelAt === 'now' ? await stripe.subscriptions.cancel(subId) : await stripe.subscriptions.update(subId, { cancel_at_period_end: true })
    await syncPlanSubscription(db, updated, settings.graceDays)
    return { canceled: true, endsNow: settings.cancelAt === 'now' }
  }

  if (resource === 'plan-resume') {
    const updated = await stripe.subscriptions.update(subId, { cancel_at_period_end: false })
    await syncPlanSubscription(db, updated, settings.graceDays)
    return { resumed: true }
  }

  throw new HttpError(404, 'Unknown action.')
}

// Included in the member's plan (Sprint 126) — same rule as the plan part
// of portal.has_workspace_access() (Portal migration 0061): their plan
// includes every product, or the product's plan is at or below theirs.
async function includedInPlan(db: Db, userId: string, productId: string): Promise<boolean> {
  const [{ data: rows, error }, { data: link }] = await Promise.all([
    db.from('member_plans').select('status, starts_at, ends_at, membership_plans(rank, entitlements)').eq('user_id', userId),
    db.from('product_plan_access').select('membership_plans(rank)').eq('product_id', productId).maybeSingle(),
  ])
  if (error || !rows) return false
  const now = Date.now()
  const live = (rows as Record<string, any>[]).filter(
    (r) => ['active', 'trialing', 'past_due'].includes(r.status) && Date.parse(r.starts_at) <= now && (!r.ends_at || Date.parse(r.ends_at) > now),
  )
  if (live.some((r) => r.membership_plans?.entitlements?.includesAll === true)) return true
  const need = (link as Record<string, any> | null)?.membership_plans?.rank
  if (typeof need !== 'number' || need <= 0) return false
  return live.some((r) => (r.membership_plans?.rank ?? 0) >= need)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowPortal(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    const resource = str(req.query.resource)
    const planResource = ['plan-checkout', 'plan-switch', 'plan-cancel', 'plan-resume', 'plan-portal'].includes(resource)
    if (!planResource && resource !== 'deletion' && resource !== 'announcements-seen' && resource !== 'download' && resource !== 'profile' && resource !== 'purchases')
      throw new HttpError(404, 'Unknown action.')
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new HttpError(500, 'This isn’t configured on this site yet.')
    const db = createClient(url, key, {
      db: { schema: 'portal' },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as Db
    const user = await signedInUser(req, db)

    if (planResource) return res.status(200).json({ ok: true, ...(await planAction(req, db, user, resource)) })
    if (resource === 'purchases' && req.method === 'GET') return res.status(200).json({ ok: true, ...(await purchasesOf(db, user.id, user.email ?? '')) })

    // One file of a Download the member owns (Sprint 86).
    if (resource === 'download') {
      if (req.method !== 'GET') throw new HttpError(405, 'Use GET.')
      const productId = str(req.query.product)
      const fileId = str(req.query.file)
      if (!productId || !fileId) throw new HttpError(400, 'Choose a file.')
      const { data: product, error: productError } = await db
        .from('products')
        .select('id, content_type, content')
        .eq('id', productId)
        .maybeSingle()
      if (productError) throw productError
      const files = ((product?.content as { files?: { id?: string }[] } | null)?.files ?? []) as { id?: string }[]
      if (!product || product.content_type !== 'pdf' || !files.some((f) => f.id === fileId)) throw new HttpError(404, 'File not found.')
      // Same rule as portal.has_workspace_access(): an active license
      // (lifetime or not expired) or an active access grant.
      const now = new Date().toISOString()
      const [{ data: licenses, error: licenseError }, { data: grants, error: grantError }] = await Promise.all([
        db
          .from('licenses')
          .select('id, access_policy, expires_at')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .eq('status', 'active'),
        db
          .from('access_grants')
          .select('id, scope, product_id, expires_at')
          .eq('user_id', user.id)
          .is('revoked_at', null),
      ])
      if (licenseError) throw licenseError
      if (grantError) throw grantError
      const licensed = (licenses ?? []).some((l) => l.access_policy === 'lifetime' || !l.expires_at || l.expires_at > now)
      const granted = (grants ?? []).some(
        (g) => (!g.expires_at || g.expires_at > now) && (g.scope === 'all' || (g.scope === 'specific' && g.product_id === productId)),
      )
      if (!licensed && !granted && !(await includedInPlan(db, user.id, productId))) throw new HttpError(403, 'You don’t have access to this file.')
      const { data: file, error: fileError } = await db.from('library_files').select('name, storage_path').eq('id', fileId).maybeSingle()
      if (fileError) throw fileError
      if (!file) throw new HttpError(404, 'This file is no longer available. Please contact support.')
      const { data: signed, error: signError } = await db.storage
        .from('library-files')
        .createSignedUrl(file.storage_path, 120, { download: file.name })
      if (signError) throw signError
      return res.status(200).json({ ok: true, url: signed.signedUrl })
    }

    // My Profile (Sprint 110): the member's own name, in portal.users (what
    // the site and the Portal show) and in the account's metadata.
    if (resource === 'profile') {
      if (req.method !== 'PATCH') throw new HttpError(405, 'Use PATCH.')
      const name = str(req.body?.fullName).replace(/\s+/g, ' ').slice(0, 80)
      if (name.length < 2) throw new HttpError(400, 'Write your name.')
      const { error } = await db.from('users').update({ full_name: name }).eq('id', user.id)
      if (error) throw error
      const { error: authError } = await db.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata ?? {}), full_name: name },
      })
      if (authError) throw authError
      return res.status(200).json({ ok: true, fullName: name })
    }

    // The member opened the bell (Sprint 80): notices up to now are seen.
    if (resource === 'announcements-seen') {
      if (req.method !== 'POST') throw new HttpError(405, 'Use POST.')
      const seenAt = new Date().toISOString()
      const { error } = await db.from('users').update({ announcements_seen_at: seenAt }).eq('id', user.id)
      if (error) throw error
      return res.status(200).json({ ok: true, seenAt })
    }

    const latest = async () => {
      const { data, error } = await db
        .from('account_deletion_requests')
        .select(COLUMNS)
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(1)
      if (error) throw error
      return data?.[0] ?? null
    }

    if (req.method === 'GET') return res.status(200).json({ ok: true, request: await latest() })

    if (req.method === 'POST') {
      const current = await latest()
      if (current?.status === 'pending') return res.status(200).json({ ok: true, request: current })

      // The team's own accounts are removed from the admin lists first.
      const [web, studio] = await Promise.all([
        db.from('website_admins').select('user_id').eq('user_id', user.id).limit(1),
        db.from('studio_admins').select('user_id').eq('user_id', user.id).limit(1),
      ])
      if ((web.data?.length ?? 0) > 0 || (studio.data?.length ?? 0) > 0) {
        throw new HttpError(409, 'This is a BGrowth team account. Remove it from the admin lists before deleting it.')
      }

      const { data: profile } = await db.from('users').select('full_name').eq('id', user.id).limit(1)
      const fullName = (profile?.[0] as { full_name?: string | null } | undefined)?.full_name ?? null
      const reason = str(req.body?.reason).slice(0, 1000) || null
      const source = req.body?.source === 'portal' ? 'portal' : 'website'
      const { data, error } = await db
        .from('account_deletion_requests')
        .insert({ user_id: user.id, email: user.email, full_name: fullName, reason, source })
        .select(COLUMNS)
        .single()
      if (error) throw error

      const first = fullName?.trim().split(/\s+/)[0]
      if (user.email) {
        await sendEmail(
          user.email,
          'We received your request to delete your BGrowth account',
          layout(
            'We received your request',
            p(`${first ? `Hi ${escapeHtml(first)},` : 'Hi there,'}`) +
              p('We received your request to delete your BGrowth account and all its data. Our team will complete it within 30 days and e-mail you when it’s done.') +
              p('Until then your account keeps working. Changed your mind? Cancel the request in <strong>Settings</strong> on bgrowth.app, or just reply to this e-mail.'),
          ),
        )
      }
      await sendEmail(
        process.env.SUPPORT_NOTIFY_EMAIL || 'support@bgrowth.app',
        `[Account deletion] ${user.email ?? user.id}`,
        `<p><strong>${escapeHtml(fullName ?? '')} ${escapeHtml(user.email ?? '')}</strong> asked to delete their account (${source}).</p>` +
          (reason ? `<blockquote style="border-left:3px solid #1061EC;margin:0;padding:4px 12px">${escapeHtml(reason)}</blockquote>` : '') +
          `<p><a href="${siteUrl(req)}/platform/admin/deletions">Review it in Admin → Deletions</a></p>`,
      )
      return res.status(200).json({ ok: true, request: data })
    }

    if (req.method === 'DELETE') {
      const { data, error } = await db
        .from('account_deletion_requests')
        .update({ status: 'cancelled', decided_at: new Date().toISOString(), decided_by: 'member' })
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .select(COLUMNS)
      if (error) throw error
      if (!data || data.length === 0) throw new HttpError(404, 'There’s no pending request to cancel.')
      return res.status(200).json({ ok: true, request: data[0] })
    }

    throw new HttpError(405, 'Method not allowed.')
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ ok: false, error: err.message })
    const code = (err as { code?: string })?.code
    if (code === '42P01' || code === 'PGRST205') {
      return res.status(503).json({ ok: false, error: 'Account deletion isn’t set up yet (database update pending).' })
    }
    console.error('[account] error:', err)
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
  }
}
