import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Plan subscriptions — the Stripe webhook (Plans & Subscriptions step 2,
// Sprint 122). Stripe tells us every time a subscription is created,
// renewed, switched, fails to pay or ends; this keeps portal.member_plans
// (Portal migrations 0057–0058) in step. Only subscriptions started by the
// Website's plan checkout (metadata kind = 'plan') are handled — Workspace
// purchases stay with the Portal's own webhook.
//
// Register in Stripe → Developers → Webhooks: https://bgrowth.app/api/webhooks/stripe,
// events customer.subscription.created / updated / deleted. Its signing
// secret goes in STRIPE_PLANS_WEBHOOK_SECRET (env); STRIPE_SECRET_KEY,
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are the existing ones.
// (Until Sprint 122 this file was the old checkout's webhook, switched off
// in Sprint 53.) Self-contained, like the other functions.

export const config = { api: { bodyParser: false } }

type Db = SupabaseClient<any, 'portal', any>

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const iso = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000).toISOString() : null)

// Stripe's subscription → one portal.member_plans row (same rule as in
// api/account.ts, which syncs right after a member switches or cancels).
async function syncSubscription(db: Db, sub: Stripe.Subscription) {
  const meta = sub.metadata ?? {}
  if (meta.kind !== 'plan' || !meta.user_id || !meta.plan_id) return 'ignored'
  // Not paid yet: the row appears once the first payment goes through.
  if (sub.status === 'incomplete') return 'waiting'

  const item = sub.items.data[0]
  const periodEnd = iso(item?.current_period_end)
  const { data: existing } = await db.from('member_plans').select('id, ends_at, status').eq('provider_subscription_id', sub.id).maybeSingle()
  const { data: settingsRow } = await db.from('site_settings').select('value').eq('key', 'plans').maybeSingle()
  const graceDays = Number((settingsRow?.value as { graceDays?: number } | undefined)?.graceDays ?? 7)

  let status: string
  let endsAt: string | null = null
  if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
    status = 'ended'
    endsAt = iso(sub.ended_at) ?? iso(sub.canceled_at) ?? new Date().toISOString()
  } else if (sub.status === 'past_due' || sub.status === 'unpaid') {
    // A failed payment keeps the plan for the tolerance days set in Admin → Plans → Settings.
    status = 'past_due'
    endsAt = existing?.status === 'past_due' && existing.ends_at ? existing.ends_at : new Date(Date.now() + graceDays * 86400000).toISOString()
  } else {
    status = sub.status === 'trialing' ? 'trialing' : 'active'
    endsAt = sub.cancel_at_period_end ? periodEnd : iso(sub.cancel_at)
  }

  const row = {
    user_id: meta.user_id,
    plan_id: meta.plan_id,
    source: 'subscription',
    status,
    billing_interval: item?.price?.recurring?.interval === 'year' ? 'year' : 'month',
    provider: 'stripe',
    provider_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    provider_subscription_id: sub.id,
    starts_at: iso(sub.start_date) ?? new Date().toISOString(),
    ends_at: endsAt,
    current_period_end: periodEnd,
    cancel_at_period_end: sub.cancel_at_period_end,
    amount_cents: item?.price?.unit_amount ?? null,
    currency: item?.price?.currency ?? 'usd',
    canceled_at: iso(sub.canceled_at),
    updated_at: new Date().toISOString(),
  }
  const { error } = await db.from('member_plans').upsert(row, { onConflict: 'provider_subscription_id' })
  if (error) throw error
  return status
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_PLANS_WEBHOOK_SECRET
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  // Not set up yet: answer 200 so Stripe doesn't keep retrying an old registration.
  if (!secretKey || !webhookSecret || !url || !key) return res.status(200).json({ received: true, ignored: 'not configured' })

  const signature = req.headers['stripe-signature']
  if (typeof signature !== 'string') return res.status(400).json({ ok: false, error: 'Missing stripe-signature header.' })

  const stripe = new Stripe(secretKey)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await readRawBody(req), signature, webhookSecret)
  } catch (err) {
    console.error('[webhooks/stripe] signature check failed:', err)
    return res.status(400).json({ ok: false, error: 'Invalid signature.' })
  }

  try {
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const db = createClient(url, key, { db: { schema: 'portal' }, auth: { persistSession: false, autoRefreshToken: false } }) as Db
      // Always read the latest state (events can arrive out of order).
      const sub = await stripe.subscriptions.retrieve((event.data.object as Stripe.Subscription).id)
      const result = await syncSubscription(db, sub)
      return res.status(200).json({ ok: true, result })
    }
    return res.status(200).json({ ok: true, ignored: event.type })
  } catch (err) {
    console.error('[webhooks/stripe] error:', err)
    return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}
