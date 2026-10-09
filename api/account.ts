import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// A member's own account requests (Sprint 65). For now: asking to delete
// the account and all its data, checking that request, and cancelling it
// while it's still pending. The team reviews and completes it in Admin →
// Deletions (api/admin.ts); nothing is deleted here.
//
//   GET    ?resource=deletion  → the member's latest request (or null)
//   POST   ?resource=deletion  { reason?, source? } → new pending request
//   DELETE ?resource=deletion  → cancel the pending request
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowPortal(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    if (str(req.query.resource) !== 'deletion') throw new HttpError(404, 'Unknown action.')
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new HttpError(500, 'This isn’t configured on this site yet.')
    const db = createClient(url, key, {
      db: { schema: 'portal' },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as Db
    const user = await signedInUser(req, db)

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
