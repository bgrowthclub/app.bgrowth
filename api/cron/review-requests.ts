import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Daily: e-mails a member once, 7 days after they got a Workspace (trial or
// purchase), asking how it's going and linking to its review form. Uses
// the Portal's own once-only marker, licenses.review_requested_at (Portal
// migration 0009) — so the Portal's "your trial ended, how was it?" e-mail
// and this one never both go to the same license. Skipped when the member
// already reviewed it or the Workspace is no longer published.
//
// Licenses from 7 to 21 days old are considered, so a missed run catches
// up and older licenses (from before this existed) are left alone.
//
// Vercel calls it with "Authorization: Bearer <CRON_SECRET>" (vercel.json
// "crons"). Self-contained like the other functions.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, RESEND_API_KEY;
// optional REVIEW_FROM_EMAIL (else SUPPORT_FROM_EMAIL), SITE_URL.

const DAY = 24 * 60 * 60 * 1000
const MIN_AGE_DAYS = 7
const MAX_AGE_DAYS = 21
const MAX_PER_RUN = 200

interface LicenseRow {
  id: string
  user_id: string
  product_id: string
  type: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

function emailHtml(firstName: string | null, productName: string, trial: boolean, reviewUrl: string) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi there,'
  const name = escapeHtml(productName)
  const lead = trial
    ? `You’ve been trying <strong>${name}</strong> for a week. How is it going?`
    : `You’ve had <strong>${name}</strong> for a week. How is it going?`
  return `
  <div style="background:#F4F7FD;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0A1B4D">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0;font-weight:800;font-size:18px">BGrowth</p>
      <h1 style="margin:20px 0 8px;font-size:22px">How is it working for you?</h1>
      <p style="margin:0 0 8px;line-height:1.6;color:#33406B">${greeting}</p>
      <p style="margin:0 0 24px;line-height:1.6;color:#33406B">${lead} A short review — a few stars and a sentence or two — helps other members choose, and tells us what to improve.</p>
      <a href="${reviewUrl}" style="display:inline-block;background:#1061EC;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">Write a review</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6B7896">Something not working? Just reply to this e-mail — it goes to our support team.</p>
    </div>
  </div>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY
  if (!url || !key) return res.status(500).json({ ok: false, error: 'Supabase isn’t configured.' })
  if (!resendKey) return res.status(500).json({ ok: false, error: 'E-mail isn’t configured (RESEND_API_KEY).' })
  const site = (process.env.SITE_URL || 'https://bgrowth.app').replace(/\/$/, '')
  const from = process.env.REVIEW_FROM_EMAIL || process.env.SUPPORT_FROM_EMAIL || 'BGrowth Support <support@bgrowth.app>'

  const db = createClient(url, key, {
    db: { schema: 'portal' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const now = Date.now()

  const { data: licenseData, error: licenseError } = await db
    .from('licenses')
    .select('id, user_id, product_id, type')
    .is('review_requested_at', null)
    .neq('status', 'revoked')
    .lte('activated_at', new Date(now - MIN_AGE_DAYS * DAY).toISOString())
    .gte('activated_at', new Date(now - MAX_AGE_DAYS * DAY).toISOString())
    .order('activated_at', { ascending: true })
    .limit(MAX_PER_RUN)
  if (licenseError) {
    console.error('[review-requests] licenses failed:', licenseError)
    return res.status(500).json({ ok: false, error: licenseError.message })
  }
  const licenses = (licenseData ?? []) as LicenseRow[]
  if (licenses.length === 0) return res.status(200).json({ ok: true, due: 0, sent: 0 })

  const userIds = [...new Set(licenses.map((l) => l.user_id))]
  const productIds = [...new Set(licenses.map((l) => l.product_id))]
  const [users, products, reviews] = await Promise.all([
    db.from('users').select('id, email, full_name').in('id', userIds),
    db.from('products').select('id, name, slug, status').in('id', productIds),
    db.from('reviews').select('user_id, product_id').in('user_id', userIds),
  ])
  const failedQuery = users.error ?? products.error ?? reviews.error
  if (failedQuery) {
    console.error('[review-requests] lookup failed:', failedQuery)
    return res.status(500).json({ ok: false, error: failedQuery.message })
  }
  const userById = new Map(((users.data ?? []) as { id: string; email: string | null; full_name: string | null }[]).map((u) => [u.id, u]))
  const productById = new Map(((products.data ?? []) as { id: string; name: string; slug: string; status: string }[]).map((p) => [p.id, p]))
  const reviewed = new Set(((reviews.data ?? []) as { user_id: string; product_id: string }[]).map((r) => `${r.user_id}:${r.product_id}`))

  let sent = 0
  let skipped = 0
  let failed = 0
  for (const license of licenses) {
    const user = userById.get(license.user_id)
    const product = productById.get(license.product_id)
    const stamp = () =>
      db.from('licenses').update({ review_requested_at: new Date().toISOString() }).eq('id', license.id)

    // Nothing to ask (already reviewed, unpublished, no address): mark it
    // done so it isn't looked at again.
    if (!user?.email || !product || product.status !== 'published' || reviewed.has(`${license.user_id}:${license.product_id}`)) {
      skipped += 1
      await stamp()
      continue
    }

    const reviewUrl = `${site}/product/${encodeURIComponent(product.slug)}?review=1#reviews`
    const firstName = user.full_name?.trim().split(/\s+/)[0] || null
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: user.email,
          subject: `How is ${product.name} working for you?`,
          html: emailHtml(firstName, product.name, license.type === 'trial', reviewUrl),
        }),
      })
      if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
      sent += 1
      const { error } = await stamp()
      if (error) console.error('[review-requests] stamp failed:', license.id, error.message)
    } catch (err) {
      // Left unstamped — tomorrow's run tries again.
      failed += 1
      console.error('[review-requests] send failed:', license.id, err)
    }
  }

  console.log(`[review-requests] due=${licenses.length} sent=${sent} skipped=${skipped} failed=${failed}`)
  return res.status(200).json({ ok: true, due: licenses.length, sent, skipped, failed })
}
