import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// BGrowth newsletter — the visitor/member side. The team side (writing and
// sending e-mails) lives in api/admin.ts (?resource=newsletter…).
//
//   POST subscribe      { email, source?, interests?, website? }  — sends a
//                        confirmation e-mail (a signed-in member subscribing
//                        their own confirmed address is subscribed at once)
//   POST confirm        { token }               — confirms a subscription
//   GET  preferences    ?token=                 — e-mail, status, interests
//   POST preferences    { token, interests?, status? } — change / unsubscribe
//   POST unsubscribe    ?token=                 — one-click (List-Unsubscribe)
//   GET  me / PUT me    (Bearer)                — the signed-in member's own
//
// The tables have no browser access (Portal migration 0036). Self-contained
// (no relative imports), like the other functions.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
// optional NEWSLETTER_FROM_EMAIL, SITE_URL.

type Db = SupabaseClient<any, 'portal', any>

const AREAS = [
  'business-entrepreneurship',
  'careers-professions',
  'languages',
  'personal-finance',
  'productivity',
  'education',
  'health-wellness',
  'family-lifestyle',
]

const RESEND_WAIT_MS = 10 * 60_000

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function str(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanEmail(value: unknown) {
  const email = str(value).toLowerCase()
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid e-mail address.')
  return email
}

function cleanInterests(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((v): v is string => typeof v === 'string' && AREAS.includes(v)))]
}

function isToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function siteUrl(req: VercelRequest) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  return `https://${Array.isArray(host) ? host[0] : host}`
}

async function sendConfirmation(req: VercelRequest, email: string, token: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new HttpError(500, 'E-mail isn’t configured on this site yet.')
  const from = process.env.NEWSLETTER_FROM_EMAIL || 'BGrowth <news@bgrowth.app>'
  const link = `${siteUrl(req)}/newsletter/confirm?token=${token}`
  const html = `
  <div style="background:#F4F7FD;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0A1B4D">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0;font-weight:800;font-size:18px">BGrowth</p>
      <h1 style="margin:20px 0 8px;font-size:22px">Confirm your subscription</h1>
      <p style="margin:0 0 24px;line-height:1.6;color:#33406B">Tap the button to start getting BGrowth news and new Workspaces in the areas you choose. If you didn’t ask for this, just ignore this e-mail.</p>
      <a href="${link}" style="display:inline-block;background:#1061EC;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">Confirm and choose my interests</a>
    </div>
  </div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: email, subject: 'Confirm your BGrowth subscription', html }),
  })
  if (!res.ok) {
    console.error('[newsletter] confirmation e-mail failed:', res.status, await res.text())
    throw new HttpError(502, 'We couldn’t send the confirmation e-mail. Please try again in a few minutes.')
  }
}

async function signedInUser(req: VercelRequest, db: Db) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

async function findByToken(db: Db, token: string) {
  if (!isToken(token)) throw new HttpError(404, 'This link isn’t valid anymore.')
  const { data, error } = await db
    .from('newsletter_subscribers')
    .select('id, email, status, interests')
    .eq('token', token)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'This link isn’t valid anymore.')
  return data as { id: string; email: string; status: string; interests: string[] }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new HttpError(500, 'The newsletter isn’t configured on this site yet.')
    const db = createClient(url, key, {
      db: { schema: 'portal' },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as Db

    const resource = str(req.query.resource)
    const action = `${req.method} ${resource}`
    const now = new Date().toISOString()

    if (action === 'POST subscribe') {
      // Hidden field real people leave empty.
      if (str(req.body?.website)) return res.status(200).json({ ok: true, status: 'check-email' })
      const email = cleanEmail(req.body?.email)
      const interests = cleanInterests(req.body?.interests)
      const source = str(req.body?.source).slice(0, 40) || null
      const user = await signedInUser(req, db)
      const ownConfirmed = Boolean(user?.email_confirmed_at && user.email?.toLowerCase() === email)

      const { data: existing, error } = await db
        .from('newsletter_subscribers')
        .select('id, status, token, confirmation_sent_at, interests')
        .eq('email', email)
        .maybeSingle()
      if (error) throw error

      if (ownConfirmed) {
        const row = {
          email,
          user_id: user!.id,
          status: 'subscribed',
          interests: interests.length ? interests : existing?.interests ?? [],
          source: source ?? 'member',
          confirmed_at: now,
          unsubscribed_at: null,
          updated_at: now,
        }
        const { error: upError } = await db.from('newsletter_subscribers').upsert(row, { onConflict: 'email' })
        if (upError) throw upError
        return res.status(200).json({ ok: true, status: 'subscribed' })
      }

      // Already confirmed: nothing to do (and nothing revealed).
      if (existing?.status === 'subscribed') return res.status(200).json({ ok: true, status: 'check-email' })

      if (existing) {
        const recent = existing.confirmation_sent_at && Date.now() - new Date(existing.confirmation_sent_at).getTime() < RESEND_WAIT_MS
        if (recent) return res.status(200).json({ ok: true, status: 'check-email' })
        const { error: upError } = await db
          .from('newsletter_subscribers')
          .update({ status: 'pending', interests: interests.length ? interests : existing.interests, confirmation_sent_at: now, updated_at: now })
          .eq('id', existing.id)
        if (upError) throw upError
        await sendConfirmation(req, email, existing.token)
        return res.status(200).json({ ok: true, status: 'check-email' })
      }

      const { data: created, error: insError } = await db
        .from('newsletter_subscribers')
        .insert({ email, interests, source, status: 'pending', confirmation_sent_at: now, user_id: user?.id ?? null })
        .select('token')
        .single()
      if (insError) throw insError
      await sendConfirmation(req, email, created.token)
      return res.status(200).json({ ok: true, status: 'check-email' })
    }

    if (action === 'POST confirm') {
      const sub = await findByToken(db, str(req.body?.token))
      if (sub.status !== 'subscribed') {
        const { error } = await db
          .from('newsletter_subscribers')
          .update({ status: 'subscribed', confirmed_at: now, unsubscribed_at: null, updated_at: now })
          .eq('id', sub.id)
        if (error) throw error
      }
      return res.status(200).json({ ok: true, email: sub.email, status: 'subscribed', interests: sub.interests })
    }

    if (action === 'GET preferences') {
      const sub = await findByToken(db, str(req.query.token))
      return res.status(200).json({ ok: true, email: sub.email, status: sub.status, interests: sub.interests })
    }

    if (action === 'POST preferences') {
      const sub = await findByToken(db, str(req.body?.token))
      const patch: Record<string, unknown> = { updated_at: now }
      if (Array.isArray(req.body?.interests)) patch.interests = cleanInterests(req.body.interests)
      const status = str(req.body?.status)
      if (status === 'unsubscribed') Object.assign(patch, { status: 'unsubscribed', unsubscribed_at: now })
      // Re-subscribing from a preferences link: the link itself proves the address.
      if (status === 'subscribed') Object.assign(patch, { status: 'subscribed', confirmed_at: now, unsubscribed_at: null })
      const { data, error } = await db
        .from('newsletter_subscribers')
        .update(patch)
        .eq('id', sub.id)
        .select('email, status, interests')
        .single()
      if (error) throw error
      return res.status(200).json({ ok: true, ...data })
    }

    // One-click unsubscribe from the mail app (RFC 8058) — token in the URL.
    if (action === 'POST unsubscribe') {
      const sub = await findByToken(db, str(req.query.token))
      const { error } = await db
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: now, updated_at: now })
        .eq('id', sub.id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    if (resource === 'me') {
      const user = await signedInUser(req, db)
      if (!user?.email) throw new HttpError(401, 'Sign in to continue.')
      const email = user.email.toLowerCase()
      if (req.method === 'GET') {
        const { data, error } = await db
          .from('newsletter_subscribers')
          .select('status, interests')
          .eq('email', email)
          .maybeSingle()
        if (error) throw error
        return res.status(200).json({ ok: true, email, status: data?.status ?? 'none', interests: data?.interests ?? [] })
      }
      if (req.method === 'PUT') {
        if (!user.email_confirmed_at) throw new HttpError(403, 'Confirm your e-mail address first — check your inbox for our link.')
        const subscribed = req.body?.subscribed === true
        const interests = cleanInterests(req.body?.interests)
        const { error } = await db.from('newsletter_subscribers').upsert(
          {
            email,
            user_id: user.id,
            interests,
            status: subscribed ? 'subscribed' : 'unsubscribed',
            source: 'member',
            ...(subscribed ? { confirmed_at: now, unsubscribed_at: null } : { unsubscribed_at: now }),
            updated_at: now,
          },
          { onConflict: 'email' },
        )
        if (error) throw error
        return res.status(200).json({ ok: true, email, status: subscribed ? 'subscribed' : 'unsubscribed', interests })
      }
    }

    return res.status(404).json({ ok: false, error: 'Unknown newsletter action.' })
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ ok: false, error: err.message })
    console.error('[newsletter] error:', err)
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
  }
}
