import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Daily review e-mails, once each, to a member who hasn't reviewed a
// Workspace yet — for a license (trial or purchase) or access given by the
// team (a "specific" access grant):
//
//  1. 7 days after the access started: "How is it working for you?"
//  2. When a trial or a timed access ends: "How was it?" — only if they
//     still haven't reviewed. Lifetime access never ends, so it only gets 1.
//
// When the period ends within 2 days of day 7 (a 7-day trial), only the
// end e-mail goes — never two e-mails about the same thing in a row.
//
// Markers (Portal migrations 0009 + 0037): review_requested_at and
// review_end_requested_at on licenses and access_grants. review_requested_at
// is also what the Portal's own "your trial ended" e-mail checks, so
// stamping it here keeps the Portal from sending a duplicate.
//
// Only accesses that started (or ended) in the last few weeks are looked
// at, so a missed run catches up and old ones are left alone.
//
// Vercel calls it with "Authorization: Bearer <CRON_SECRET>" (vercel.json
// "crons"). Self-contained like the other functions.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, RESEND_API_KEY;
// optional REVIEW_FROM_EMAIL (else SUPPORT_FROM_EMAIL), SITE_URL.

const DAY = 24 * 60 * 60 * 1000
const FIRST_AFTER_DAYS = 7
const START_WINDOW_DAYS = 21
const END_WINDOW_DAYS = 14
const SAME_TIME_DAYS = 2
const MAX_PER_QUERY = 200

type Kind = 'license' | 'grant'
type Moment = 'week' | 'end'

interface Access {
  kind: Kind
  id: string
  userId: string
  productId: string
  trial: boolean
  startedAt: string
  endsAt: string | null
  requestedAt: string | null
}

interface LicenseRow {
  id: string
  user_id: string
  product_id: string
  type: string
  activated_at: string
  expires_at: string | null
  review_requested_at: string | null
}

interface GrantRow {
  id: string
  user_id: string
  product_id: string
  created_at: string
  expires_at: string | null
  review_requested_at: string | null
}

const iso = (ms: number) => new Date(ms).toISOString()

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

// Copy from the review plan agreed on 25/07 (GPT): at the end of a trial,
// "How was your experience with {Product}?" with Rate + Buy Now; for
// someone using it, "You've been using your Workspace for a while… would
// you mind leaving a review?".
function buildEmail(moment: Moment, access: Access, firstName: string | null, productName: string, reviewUrl: string, buyUrl: string) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi there,'
  const name = escapeHtml(productName)
  const button = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;${primary ? 'background:#1061EC;color:#ffffff;' : 'background:#ffffff;color:#1061EC;border:1px solid #C9D7F5;'}text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${label}</a>`
  const stars = `<a href="${reviewUrl}" style="display:block;margin:0 0 20px;font-size:28px;letter-spacing:4px;color:#1061EC;text-decoration:none">★★★★★</a>`
  let subject: string
  let body: string
  if (moment === 'week') {
    subject = `How is ${productName} working for you?`
    body = `
      <p style="margin:0 0 16px;line-height:1.6;color:#33406B">You’ve been using <strong>${name}</strong> for a while. Would you mind leaving a review? It only takes a minute and helps other members choose.</p>
      ${stars}
      ${button(reviewUrl, 'Rate this Workspace', true)}`
  } else {
    subject = `How was your experience with ${productName}?`
    const thanks = access.trial
      ? `Thank you for trying <strong>${name}</strong>. Your free trial has ended.`
      : `Thank you for using <strong>${name}</strong>. Your access has ended.`
    body = `
      <p style="margin:0 0 16px;line-height:1.6;color:#33406B">${thanks} We’d love to hear your opinion.</p>
      ${stars}
      ${button(reviewUrl, 'Rate this Workspace', true)}
      <p style="margin:16px 0 12px;line-height:1.6;color:#33406B">If you’d like to continue using it, you can purchase it anytime — your saved records are still there.</p>
      ${button(buyUrl, 'Buy Now', false)}`
  }
  const html = `
  <div style="background:#F4F7FD;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0A1B4D">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0;font-weight:800;font-size:18px">BGrowth</p>
      <p style="margin:20px 0 16px;line-height:1.6;color:#33406B">${greeting}</p>
      ${body}
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6B7896">Something not working? Just reply to this e-mail — it goes to our support team.</p>
    </div>
  </div>`
  return { subject, html }
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
  const startFrom = iso(now - START_WINDOW_DAYS * DAY)
  const startTo = iso(now - FIRST_AFTER_DAYS * DAY)
  const endFrom = iso(now - END_WINDOW_DAYS * DAY)
  const endTo = iso(now)
  const LICENSE_COLUMNS = 'id, user_id, product_id, type, activated_at, expires_at, review_requested_at'
  const GRANT_COLUMNS = 'id, user_id, product_id, created_at, expires_at, review_requested_at'

  const [lWeek, lEnd, gWeek, gEnd] = await Promise.all([
    db.from('licenses').select(LICENSE_COLUMNS).is('review_requested_at', null).neq('status', 'revoked')
      .gte('activated_at', startFrom).lte('activated_at', startTo).limit(MAX_PER_QUERY),
    db.from('licenses').select(LICENSE_COLUMNS).is('review_end_requested_at', null).neq('status', 'revoked')
      .gte('expires_at', endFrom).lte('expires_at', endTo).limit(MAX_PER_QUERY),
    db.from('access_grants').select(GRANT_COLUMNS).is('review_requested_at', null).is('revoked_at', null)
      .eq('scope', 'specific').gte('created_at', startFrom).lte('created_at', startTo).limit(MAX_PER_QUERY),
    db.from('access_grants').select(GRANT_COLUMNS).is('review_end_requested_at', null).is('revoked_at', null)
      .eq('scope', 'specific').gte('expires_at', endFrom).lte('expires_at', endTo).limit(MAX_PER_QUERY),
  ])
  const queryError = lWeek.error ?? lEnd.error ?? gWeek.error ?? gEnd.error
  if (queryError) {
    // review_end_requested_at missing = Portal migration 0037 not run yet.
    console.error('[review-requests] query failed:', queryError)
    return res.status(500).json({ ok: false, error: queryError.message })
  }

  const fromLicense = (l: LicenseRow): Access => ({
    kind: 'license', id: l.id, userId: l.user_id, productId: l.product_id, trial: l.type === 'trial',
    startedAt: l.activated_at, endsAt: l.expires_at, requestedAt: l.review_requested_at,
  })
  const fromGrant = (g: GrantRow): Access => ({
    kind: 'grant', id: g.id, userId: g.user_id, productId: g.product_id, trial: false,
    startedAt: g.created_at, endsAt: g.expires_at, requestedAt: g.review_requested_at,
  })
  // End-of-period first: when both are due the same day, only that one goes.
  const due: { moment: Moment; access: Access }[] = [
    ...((lEnd.data ?? []) as LicenseRow[]).map((l) => ({ moment: 'end' as const, access: fromLicense(l) })),
    ...((gEnd.data ?? []) as GrantRow[]).map((g) => ({ moment: 'end' as const, access: fromGrant(g) })),
    ...((lWeek.data ?? []) as LicenseRow[]).map((l) => ({ moment: 'week' as const, access: fromLicense(l) })),
    ...((gWeek.data ?? []) as GrantRow[]).map((g) => ({ moment: 'week' as const, access: fromGrant(g) })),
  ]
  if (due.length === 0) return res.status(200).json({ ok: true, due: 0, sent: 0 })

  const userIds = [...new Set(due.map((d) => d.access.userId))]
  const productIds = [...new Set(due.map((d) => d.access.productId))]
  const [users, products, reviews] = await Promise.all([
    db.from('users').select('id, email, full_name').in('id', userIds),
    db.from('products').select('id, name, slug, status').in('id', productIds),
    db.from('reviews').select('user_id, product_id').in('user_id', userIds),
  ])
  const lookupError = users.error ?? products.error ?? reviews.error
  if (lookupError) {
    console.error('[review-requests] lookup failed:', lookupError)
    return res.status(500).json({ ok: false, error: lookupError.message })
  }
  const userById = new Map(((users.data ?? []) as { id: string; email: string | null; full_name: string | null }[]).map((u) => [u.id, u]))
  const productById = new Map(((products.data ?? []) as { id: string; name: string; slug: string; status: string }[]).map((p) => [p.id, p]))
  const reviewed = new Set(((reviews.data ?? []) as { user_id: string; product_id: string }[]).map((r) => `${r.user_id}:${r.product_id}`))
  const handledToday = new Set<string>()

  let sent = 0
  let skipped = 0
  let failed = 0
  for (const { moment, access } of due) {
    const table = access.kind === 'license' ? 'licenses' : 'access_grants'
    const stampedAt = new Date().toISOString()
    // The end e-mail also fills the 7-day marker, so neither the 7-day one
    // nor the Portal's trial e-mail follows it.
    const stamp = () =>
      db.from(table)
        .update(moment === 'end'
          ? { review_end_requested_at: stampedAt, ...(access.requestedAt ? {} : { review_requested_at: stampedAt }) }
          : { review_requested_at: stampedAt })
        .eq('id', access.id)

    const pair = `${access.userId}:${access.productId}`
    const user = userById.get(access.userId)
    const product = productById.get(access.productId)
    const endsSoonAfterWeek =
      moment === 'week' &&
      access.endsAt !== null &&
      new Date(access.endsAt).getTime() - new Date(access.startedAt).getTime() <= (FIRST_AFTER_DAYS + SAME_TIME_DAYS) * DAY
    // The Portal already sent its "trial ended" e-mail (it stamps review_requested_at).
    const portalSentEnd =
      moment === 'end' && access.requestedAt !== null && access.endsAt !== null && access.requestedAt >= access.endsAt

    // Left unstamped on purpose: the end e-mail, a day or two later, fills
    // both markers. (Stamping now would read as "the Portal already sent".)
    if (endsSoonAfterWeek) {
      skipped += 1
      continue
    }

    if (
      !user?.email ||
      !product ||
      product.status !== 'published' ||
      reviewed.has(pair) ||
      handledToday.has(pair) ||
      portalSentEnd
    ) {
      skipped += 1
      await stamp()
      continue
    }

    const reviewUrl = `${site}/product/${encodeURIComponent(product.slug)}?review=1#reviews`
    const buyUrl = `${site}/product/${encodeURIComponent(product.slug)}`
    const firstName = user.full_name?.trim().split(/\s+/)[0] || null
    const { subject, html } = buildEmail(moment, access, firstName, product.name, reviewUrl, buyUrl)
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: user.email, subject, html }),
      })
      if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
      sent += 1
      handledToday.add(pair)
      const { error } = await stamp()
      if (error) console.error('[review-requests] stamp failed:', table, access.id, error.message)
    } catch (err) {
      // Left unstamped — tomorrow's run tries again.
      failed += 1
      console.error('[review-requests] send failed:', table, access.id, err)
    }
  }

  console.log(`[review-requests] due=${due.length} sent=${sent} skipped=${skipped} failed=${failed}`)
  return res.status(200).json({ ok: true, due: due.length, sent, skipped, failed })
}
