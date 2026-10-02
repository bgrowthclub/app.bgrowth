import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
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
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY

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
  status: string
  access_policy?: string
  expires_at: string | null
}

function ownsActively(license: LicenseRow | null): boolean {
  if (!license || license.status !== 'active') return false
  if (license.access_policy === 'lifetime' || license.expires_at === null) return true
  return new Date(license.expires_at).getTime() > Date.now()
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
    if (license?.type !== 'trial' && ownsActively(license)) {
      return res.status(200).json({ ok: true, redirectUrl: viewerPath })
    }

    if (product.is_free) {
      const { error: grantError } = await supabase.rpc('grant_purchased_license', {
        p_user_id: user.id,
        p_product_id: product.id,
      })
      if (grantError) throw grantError
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
