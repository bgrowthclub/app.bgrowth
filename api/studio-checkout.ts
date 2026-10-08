import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Buying a Workspace published from BGrowth Studio, from bgrowth.app.
//
// Mirrors the Portal's api/checkout/create-session.ts on purpose, so the
// Website and the Portal sell the same way while both are live:
//   - same Supabase project (`portal` schema) and the same Stripe account;
//   - free Workspace → grant_purchased_license() immediately;
//   - paid Workspace → Stripe Checkout Session with the SAME metadata
//     (userId, productId, productSlug). The Portal's existing Stripe
//     webhook (/api/webhooks/stripe on the Portal) receives every
//     checkout.session.completed event of the account and grants the
//     license — no second webhook, no double grant. When the Portal is
//     retired, that webhook moves here.
//
// Self-contained (no relative imports): Vercel runs this as a Node ESM
// function, where extension-less relative imports don't resolve.
//
// Server-only environment variables (Vercel → Settings → Environment
// Variables, type Secret, same values as the Portal project):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY;
//   RESEND_API_KEY (+ optional SUPPORT_FROM_EMAIL, SITE_URL) for the
//   "it's ready" e-mails.
//
// Confirmation e-mails (Sprint 64): a free Workspace claimed here gets one
// right away; a trial (started in the browser, see studioPurchase.ts) asks
// for its e-mail with { productSlug, notify: 'trial' } right after — sent
// only for a trial that started in the last few minutes. Paid purchases
// get theirs from the Portal's Stripe webhook. Each send is logged in
// portal.email_log (migration 0038).

interface ProductRow {
  id: string
  slug: string
  name: string
  short_description: string | null
  cover_image_url: string | null
  is_free: boolean
  price_cents: number | null
  currency: string
  stripe_price_id: string | null
}

interface LicenseRow {
  type: string
  activated_at?: string
  status: string
  access_policy?: string
  expires_at: string | null
}

function ownsActively(license: LicenseRow | null): boolean {
  if (!license || license.status !== 'active') return false
  if (license.access_policy === 'lifetime' || license.expires_at === null) return true
  return new Date(license.expires_at).getTime() > Date.now()
}

const TRIAL_EMAIL_WINDOW_MS = 15 * 60 * 1000

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

function accessEmail(kind: 'free' | 'trial', firstName: string | null, productName: string, openUrl: string, expiresAt: string | null) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi there,'
  const name = escapeHtml(productName)
  const until = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null
  const subject = kind === 'free' ? `${productName} is ready for you` : `Your free trial of ${productName} has started`
  const heading = kind === 'free' ? 'Your Workspace is ready' : 'Your free trial has started'
  const lead =
    kind === 'free'
      ? `<strong>${name}</strong> is now in your Workspaces — free, for as long as you want.`
      : `You have full access to <strong>${name}</strong>${until ? ` until <strong>${until}</strong>` : ''}. When the trial ends, everything you saved stays there — buy it anytime to keep working.`
  const html = `
  <div style="background:#F4F7FD;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0A1B4D">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0;font-weight:800;font-size:18px">BGrowth</p>
      <h1 style="margin:20px 0 8px;font-size:22px">${heading}</h1>
      <p style="margin:0 0 8px;line-height:1.6;color:#33406B">${greeting}</p>
      <p style="margin:0 0 16px;line-height:1.6;color:#33406B">${lead}</p>
      <p style="margin:0 0 24px;line-height:1.6;color:#33406B">Tip: create one record for each client or job — each one is saved on its own, so you can come back to it anytime.</p>
      <a href="${openUrl}" style="display:inline-block;background:#1061EC;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">Open Workspace</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6B7896">Questions? Just reply to this e-mail — it goes to our support team.</p>
    </div>
  </div>`
  return { subject, html }
}

// Best effort: a failed e-mail never fails the claim or the trial.
async function sendAccessEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  req: VercelRequest,
  kind: 'free' | 'trial',
  user: { id: string; email?: string },
  product: { name: string; slug: string },
  expiresAt: string | null,
) {
  const key = process.env.RESEND_API_KEY
  if (!key || !user.email) return
  try {
    const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).limit(1)
    const fullName = ((profile?.[0] ?? null) as { full_name?: string | null } | null)?.full_name ?? null
    const firstName = fullName?.trim().split(/\s+/)[0] || null
    const site = (process.env.SITE_URL || siteOrigin(req)).replace(/\/$/, '')
    const { subject, html } = accessEmail(kind, firstName, product.name, `${site}/platform/workspace/${encodeURIComponent(product.slug)}`, expiresAt)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM_EMAIL || 'BGrowth Support <support@bgrowth.app>',
        to: user.email,
        subject,
        html,
      }),
    })
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
    const { error } = await supabase.from('email_log').insert({ kind: kind === 'free' ? 'free_claimed' : 'trial_started', user_id: user.id })
    if (error) console.error('[studio-checkout] log failed:', error.message)
  } catch (err) {
    console.error('[studio-checkout] access e-mail failed:', err)
  }
}

function siteOrigin(req: VercelRequest): string {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  const proto = req.headers['x-forwarded-proto'] ?? 'https'
  return `${Array.isArray(proto) ? proto[0] : proto}://${Array.isArray(host) ? host[0] : host}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
    if (!token) return res.status(401).json({ ok: false, error: 'Sign in to continue.' })

    const productSlug = typeof req.body?.productSlug === 'string' ? req.body.productSlug.trim() : ''
    if (!productSlug) return res.status(422).json({ ok: false, error: 'Missing product.' })

    const url = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      return res.status(500).json({ ok: false, error: 'Checkout isn’t configured on this site yet.' })
    }
    const supabase = createClient(url, serviceRoleKey, {
      db: { schema: 'portal' },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userResult, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userResult.user) return res.status(401).json({ ok: false, error: 'Sign in to continue.' })
    const user = userResult.user

    const { data: productRows, error: productError } = await supabase
      .from('products')
      .select('id, slug, name, short_description, cover_image_url, is_free, price_cents, currency, stripe_price_id')
      .eq('slug', productSlug)
      .eq('status', 'published')
      .limit(1)
    if (productError) throw productError
    const product = (productRows?.[0] ?? null) as ProductRow | null
    if (!product) return res.status(404).json({ ok: false, error: 'This Workspace isn’t available.' })

    const viewerPath = `/platform/workspace/${encodeURIComponent(product.slug)}`

    // Already owned (purchase or live trial) — straight into the Workspace,
    // never a second charge.
    const { data: licenseRows, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .limit(1)
    if (licenseError) throw licenseError
    const license = (licenseRows?.[0] ?? null) as LicenseRow | null
    // The trial was just started in the browser — send its e-mail once.
    if (req.body?.notify === 'trial') {
      const fresh =
        license?.type === 'trial' &&
        ownsActively(license) &&
        Boolean(license.activated_at) &&
        Date.now() - new Date(license.activated_at as string).getTime() < TRIAL_EMAIL_WINDOW_MS
      if (!fresh) return res.status(200).json({ ok: true, sent: false })
      // Asked twice (double click, reload)? One e-mail only.
      const { data: already } = await supabase
        .from('email_log')
        .select('id')
        .eq('kind', 'trial_started')
        .eq('user_id', user.id)
        .gte('sent_at', license?.activated_at as string)
        .limit(1)
      if (already && already.length > 0) return res.status(200).json({ ok: true, sent: false })
      await sendAccessEmail(supabase, req, 'trial', user, product, license?.expires_at ?? null)
      return res.status(200).json({ ok: true, sent: true })
    }

    if (license?.type !== 'trial' && ownsActively(license)) {
      return res.status(200).json({ ok: true, redirectUrl: viewerPath })
    }

    if (product.is_free) {
      const { error: grantError } = await supabase.rpc('grant_purchased_license', {
        p_user_id: user.id,
        p_product_id: product.id,
      })
      if (grantError) throw grantError
      await sendAccessEmail(supabase, req, 'free', user, product, null)
      return res.status(200).json({ ok: true, redirectUrl: viewerPath })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) return res.status(500).json({ ok: false, error: 'Checkout isn’t configured on this site yet.' })
    if (product.price_cents == null) {
      return res.status(500).json({ ok: false, error: `“${product.name}” has no price configured yet.` })
    }

    const origin = siteOrigin(req)
    const productUrl = `${origin}/product/${encodeURIComponent(product.slug)}`
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        product.stripe_price_id
          ? { price: product.stripe_price_id, quantity: 1 }
          : {
              price_data: {
                currency: product.currency,
                unit_amount: product.price_cents,
                product_data: {
                  name: product.name,
                  ...(product.short_description ? { description: product.short_description } : {}),
                  ...(product.cover_image_url ? { images: [product.cover_image_url] } : {}),
                },
              },
              quantity: 1,
            },
      ],
      success_url: `${productUrl}?checkout=success`,
      cancel_url: `${productUrl}?checkout=cancelled`,
      // Same keys the Portal's webhook reads to grant the license.
      metadata: { userId: user.id, productId: product.id, productSlug: product.slug, source: 'website' },
    })
    if (!session.url) throw new Error('Stripe did not return a checkout URL.')

    return res.status(200).json({ ok: true, checkoutUrl: session.url })
  } catch (err) {
    console.error('[studio-checkout] error:', err)
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err)
    return res.status(500).json({ ok: false, error: message })
  }
}
