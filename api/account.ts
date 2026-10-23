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
//   GET/PUT ?resource=my-page, POST my-page-image → the subscriber's own
//          public page (Sprint 127, see the My Page section below)
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

// ---------------------------------------------------------------------------
// My Page (Sprint 127, Portal migration 0062): the subscriber edits their own
// public page, as far as their plan allows (portal.member_page_level):
//   'partial' (Pro) — a model's blocks in its order (no adding or reordering;
//     hiding yes, since Sprint 128), the model's color (any background tint), no cover, ONE featured photo/video, no
//     gallery photos; the address is set once, from the name.
//   'full' (Enterprise) — everything, including the address.
//   GET  ?resource=my-page        → { level, page }
//   PUT  ?resource=my-page        { …page } → { page }
//   POST ?resource=my-page-image  { dataUrl } → { url }
// ---------------------------------------------------------------------------
const MEMBER_LINK_TYPES = ['whatsapp', 'whatsapp_group', 'phone', 'booking', 'email', 'instagram', 'tiktok', 'youtube', 'website', 'other']
const PAGE_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const RESERVED_PAGE_SLUGS = new Set(['admin', 'bgrowth', 'support', 'help', 'api', 'new', 'edit', 'settings'])
const VIDEO_HOSTS = /^https:\/\/((www|m)\.)?(youtube\.com|youtu\.be|tiktok\.com|instagram\.com)\//i
// The block order of each model — a Pro page must keep one of these.
const TEMPLATE_SEQUENCES: Record<string, string> = {
  professional: 'hero,contact,services,credentials,area,about,faq,cta',
  local: 'hero,services,highlights,area,testimonials,faq,contact,cta',
  creative: 'hero,highlights,gallery,about,services,testimonials,contact,cta',
  personal: 'hero,about,services,testimonials,highlights,faq,contact,cta',
  affiliate: 'hero,products,about,contact',
  links: 'hero,contact,about',
  cleaning: 'hero,contact,services,highlights,testimonials,area,faq,cta',
  notary: 'hero,contact,services,area,about,faq,cta',
  teacher: 'hero,contact,highlights,services,text,testimonials,about,cta',
  creator: 'hero,contact,highlights,gallery,services,text,cta',
  blank: 'hero,contact',
}
const TEMPLATE_COLORS: Record<string, string> = {
  professional: 'navy', local: 'orange', creative: 'rose', personal: 'green', affiliate: 'blue', links: 'teal',
  cleaning: 'teal', notary: 'navy', teacher: 'purple', creator: 'rose', blank: 'blue',
}

async function memberPageLevel(db: Db, userId: string): Promise<'partial' | 'full' | null> {
  const { data, error } = await db.rpc('member_page_level', { p_user: userId })
  if (error) return null
  return data === 'full' || data === 'partial' ? data : null
}

// The page models the member's plans allow (Sprint 132): null = all of them
// (a plan with a page and no list), else the union of the plans' lists.
async function memberPageTemplates(db: Db, userId: string): Promise<string[] | null> {
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('member_plans')
    .select('starts_at, ends_at, membership_plans(entitlements)')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
  if (error) return null
  const allowed = new Set<string>()
  for (const row of (data ?? []) as any[]) {
    if (row.starts_at > now || (row.ends_at && row.ends_at <= now)) continue
    const ent = (Array.isArray(row.membership_plans) ? row.membership_plans[0] : row.membership_plans)?.entitlements ?? {}
    if (ent.memberPage !== 'partial' && ent.memberPage !== 'full') continue
    if (!Array.isArray(ent.pageTemplates) || !ent.pageTemplates.length) return null
    ent.pageTemplates.forEach((t: string) => allowed.add(t))
  }
  return [...allowed]
}

function slugFrom(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function slugTaken(db: Db, slug: string, exceptId?: string) {
  let q = db.from('member_pages').select('id').eq('slug', slug).limit(1)
  if (exceptId) q = q.neq('id', exceptId)
  const { data } = await q
  return Boolean(data && data.length) || (await slugUsedBefore(db, slug, exceptId))
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

function readMyPage(b: Record<string, any>) {
  const displayName = pageText(b.displayName, 80)
  if (!displayName) throw new HttpError(400, 'Write the name shown on your page.')
  const links = (Array.isArray(b.links) ? b.links : []).slice(0, 12).flatMap((raw: any) => {
    const type = MEMBER_LINK_TYPES.includes(raw?.type) ? raw.type : 'other'
    const url = pageText(raw?.url, 300)
    if (!url) return []
    if (type === 'email' && !/^(mailto:)?[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) throw new HttpError(400, `“${url}” isn’t an e-mail address.`)
    // A WhatsApp group is its invite link (Sprint 134).
    if (type === 'whatsapp_group' && !/^https:\/\/chat\.whatsapp\.com\/\S+$/i.test(url)) {
      throw new HttpError(400, 'Paste the group’s full invite link (https://chat.whatsapp.com/…) — in WhatsApp: Group info → Invite via link → Copy link.')
    }
    if ((type === 'whatsapp' || type === 'phone') && !/^https?:\/\//.test(url) && url.replace(/\D/g, '').length < 8) {
      throw new HttpError(400, 'Write the WhatsApp number with country code (for example +1 555 123 4567).')
    }
    return [{ type, label: pageText(raw?.label, 40), url }]
  })
  const services = (Array.isArray(b.services) ? b.services : []).slice(0, 12).flatMap((raw: any) => {
    const title = pageText(raw?.title, 100)
    return title ? [{ title, description: pageText(raw?.description, 400), price: pageText(raw?.price, 40) }] : []
  })
  const highlights = (Array.isArray(b.highlights) ? b.highlights : []).slice(0, 8).flatMap((raw: any) => {
    const title = pageText(raw?.title, 100)
    if (!title) return []
    const video = pageText(raw?.video, 300)
    if (video && !VIDEO_HOSTS.test(video)) throw new HttpError(400, `The video of “${title}” must be a YouTube, TikTok or Instagram link.`)
    return [{ title, description: pageText(raw?.description, 400), url: pageUrl(raw?.url), image: pageUrl(raw?.image), video, cta: pageText(raw?.cta, 40) }]
  })
  return {
    display_name: displayName,
    headline: pageText(b.headline, 140) || null,
    bio: pageText(b.bio, 3000) || null,
    photo_url: pageUrl(b.photoUrl) || null,
    location: pageText(b.location, 100) || null,
    links,
    services,
    highlights,
    language: b.language === 'pt' ? 'pt' : 'en',
    status: b.status === 'published' ? 'published' : 'draft',
    template: PAGE_TEMPLATES.has(b.template) ? b.template : 'professional',
    blocks: cleanPageBlocks(b.blocks),
    theme: cleanPageTheme(b.theme),
  }
}

async function myPageAction(req: VercelRequest, db: Db, user: { id: string }, resource: string) {
  const level = await memberPageLevel(db, user.id)
  const { data: existing, error } = await db
    .from('member_pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (error) {
    const code = (error as { code?: string }).code
    if (code === '42703' || code === '42P01' || code === 'PGRST205') throw new HttpError(503, 'Your page isn’t available yet (database update pending).')
    throw error
  }

  const templates = level ? await memberPageTemplates(db, user.id) : null
  if (resource === 'my-page' && req.method === 'GET') return { level, templates, page: existing ?? null }
  // The page's e-mail list (Sprint 139, Portal migration 0065) — the owner's,
  // including a page the team made for them.
  if (resource === 'my-page-signups') {
    if (!existing) return { signups: [] }
    if (req.method === 'DELETE') {
      const id = str(req.query.id)
      const { error: delError } = await db.from('member_page_signups').delete().eq('id', id).eq('page_id', existing.id)
      if (delError) throw delError
      return {}
    }
    const { data, error: listError } = await db
      .from('member_page_signups')
      .select('id, email, name, whatsapp, created_at')
      .eq('page_id', existing.id)
      .order('created_at', { ascending: false })
      .limit(5000)
    if (listError) {
      if ((listError as { code?: string }).code === '42P01' || (listError as { code?: string }).code === 'PGRST205') return { signups: [] }
      throw listError
    }
    return { signups: data ?? [] }
  }
  if (!level) throw new HttpError(403, 'Your plan doesn’t include a page. See the plans in Account → Membership.')
  // A page the team made for this member stays the team's to edit.
  if (existing && !existing.owner_managed) throw new HttpError(403, 'Your page is managed by the BGrowth team — talk to us through Support to change it.')

  if (resource === 'my-page-image') {
    if (req.method !== 'POST') throw new HttpError(405, 'Use POST.')
    const match = /^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(str(req.body?.dataUrl))
    if (!match) throw new HttpError(400, 'Use a PNG, JPG or WebP image.')
    const bytes = Buffer.from(match[3], 'base64')
    if (bytes.length > 3 * 1024 * 1024) throw new HttpError(413, 'This image is too large (3 MB max).')
    const path = `pages/members/${user.id}/${Date.now()}.${match[2] === 'jpeg' ? 'jpg' : match[2]}`
    const { error: upError } = await db.storage.from('portal-product-assets').upload(path, bytes, { contentType: match[1], upsert: false })
    if (upError) throw upError
    return { url: db.storage.from('portal-product-assets').getPublicUrl(path).data.publicUrl }
  }

  if (req.method !== 'PUT') throw new HttpError(405, 'Use PUT.')
  const input = readMyPage((req.body ?? {}) as Record<string, any>)
  if (templates && !templates.includes(input.template)) throw new HttpError(403, 'Your plan doesn’t include this model — choose another one or see the plans in Account → Membership.')
  let slug = existing?.slug as string | undefined

  if (level === 'partial') {
    // A model's blocks as they are; the model's color; one featured item.
    // They may switch to another model; its sections then come as they are.
    const template = input.template
    // The e-mail section isn't part of a model: it's added on its own when
    // the team switched it on for this page (signup_granted).
    if (!existing?.signup_granted) input.blocks = (input.blocks ?? []).filter((b) => b.type !== 'signup') as typeof input.blocks
    const sequence = (input.blocks ?? []).filter((b) => b.type !== 'signup').map((b) => b.type).join(',')
    if (!TEMPLATE_SEQUENCES[template] || sequence !== TEMPLATE_SEQUENCES[template]) throw new HttpError(400, 'Your plan keeps the model’s sections as they are.')
    input.template = template
    input.blocks = (input.blocks ?? []).map((b) => {
      const { hidden, ...rest } = b as Record<string, any>
      const block = b.type === 'gallery' ? { ...rest, data: { ...(rest.data ?? {}), images: [] } } : rest
      return hidden && b.type !== 'hero' ? { ...block, hidden: true } : block
    }) as typeof input.blocks
    // The model's color; the background tint is open to every plan.
    input.theme = { color: TEMPLATE_COLORS[template], ...(input.theme.background ? { background: input.theme.background } : {}) }
    input.highlights = input.highlights.slice(0, 1)
    // Pro: up to 12 product picks (Enterprise: 60).
    input.blocks = (input.blocks ?? []).map((b: any) =>
      b.type === 'products' && b.data?.products ? { ...b, data: { ...b.data, products: b.data.products.slice(0, 12) } } : b,
    ) as typeof input.blocks
  } else {
    const wanted = slugFrom(pageText(req.body?.slug, 40))
    if (wanted && wanted !== slug) {
      if (!PAGE_SLUG.test(wanted) || wanted.length < 3) throw new HttpError(400, 'The address needs 3 to 40 lowercase letters, numbers or dashes.')
      if (RESERVED_PAGE_SLUGS.has(wanted)) throw new HttpError(400, 'This address is reserved — choose another one.')
      if (await slugTaken(db, wanted, existing?.id)) throw new HttpError(409, `bgrowth.app/p/${wanted} is already taken — choose another address.`)
      slug = wanted
    }
  }

  if (!slug) {
    // First save: an address from the name, made unique.
    const base = slugFrom(input.display_name).slice(0, 34) || 'page'
    slug = base.length >= 3 ? base : `${base}-page`
    for (let n = 2; RESERVED_PAGE_SLUGS.has(slug) || (await slugTaken(db, slug)); n += 1) slug = `${base}-${n}`
  }

  const moved = existing ? await previousSlugsAfter(db, existing.id, existing.slug, slug) : {}
  const row = { ...input, ...moved, slug, user_id: user.id, owner_managed: true, updated_at: new Date().toISOString() }
  const { data, error: saveError } = existing
    ? await db.from('member_pages').update(row).eq('id', existing.id).select('*').single()
    : await db.from('member_pages').insert(row).select('*').single()
  if (saveError) throw saveError
  return { page: data }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowPortal(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    const resource = str(req.query.resource)
    const planResource = ['plan-checkout', 'plan-switch', 'plan-cancel', 'plan-resume', 'plan-portal'].includes(resource)
    const pageResource = resource === 'my-page' || resource === 'my-page-image' || resource === 'my-page-signups'
    if (!planResource && !pageResource && resource !== 'deletion' && resource !== 'announcements-seen' && resource !== 'download' && resource !== 'profile' && resource !== 'purchases')
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
    if (pageResource) return res.status(200).json({ ok: true, ...(await myPageAction(req, db, user, resource)) })
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
