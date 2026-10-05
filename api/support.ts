import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// BGrowth Support Center — the member side. A signed-in member opens a
// conversation with the team and talks in it: live chat during support
// hours, a ticket outside them (the team answers by e-mail too). The team
// side lives in api/admin.ts (?resource=support…).
//
// Every request is authenticated with the member's Supabase access token
// and only ever touches that member's own conversations; the tables have
// no browser access at all (Portal migration 0031).
//
// Self-contained (no relative imports), like the other functions.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; optional RESEND_API_KEY,
// SUPPORT_FROM_EMAIL, SUPPORT_NOTIFY_EMAIL (e-mail the team about new
// messages), SITE_URL.

type Db = SupabaseClient<any, 'portal', any>

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

interface SupportHours {
  timezone: string
  days: number[] // 0 = Sunday … 6 = Saturday
  start: string // "HH:MM"
  end: string // "HH:MM"
}

const DEFAULT_HOURS: SupportHours = { timezone: 'America/Los_Angeles', days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function siteUrl(req: VercelRequest) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  return `https://${Array.isArray(host) ? host[0] : host}`
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

// Best effort: a failed e-mail never fails the message itself.
async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const from = process.env.SUPPORT_FROM_EMAIL || 'BGrowth Support <support@bgrowth.app>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, reply_to: 'support@bgrowth.app' }),
    })
    if (!res.ok) console.error('[support] e-mail failed:', res.status, await res.text())
  } catch (err) {
    console.error('[support] e-mail failed:', err)
  }
}

async function notifyTeam(req: VercelRequest, who: string, subject: string, body: string, online: boolean) {
  const to = process.env.SUPPORT_NOTIFY_EMAIL || 'support@bgrowth.app'
  await sendEmail(
    to,
    `[Support] ${subject}`,
    `<p><strong>${escapeHtml(who)}</strong> wrote${online ? '' : ' (outside support hours)'}:</p>
     <blockquote style="border-left:3px solid #1061EC;margin:0;padding:4px 12px;color:#0A1B4D">${escapeHtml(body).replace(/\n/g, '<br>')}</blockquote>
     <p><a href="${siteUrl(req)}/platform/admin/support">Answer in Admin → Support</a></p>`,
  )
}

function str(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new HttpError(500, 'Support isn’t configured on this site yet.')
    const db = createClient(url, key, {
      db: { schema: 'portal' },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as Db

    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) throw new HttpError(401, 'Sign in to contact support.')
    const { data: auth, error: authError } = await db.auth.getUser(token)
    if (authError || !auth.user) throw new HttpError(401, 'Sign in to contact support.')
    const user = auth.user
    const name = (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) || user.email || 'Member'

    const resource = str(req.query.resource)
    const key2 = `${req.method} ${resource}`

    if (key2 === 'GET state') {
      const hours = await loadHours(db)
      const { data: conversations, error } = await db
        .from('support_conversations')
        .select('id, subject, status, last_sender, last_message_at, customer_read_at, created_at')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({
        ok: true,
        hours,
        online: isOnline(hours),
        conversations: (conversations ?? []).map((c) => ({
          ...c,
          unread: c.last_sender === 'staff' && new Date(c.last_message_at) > new Date(c.customer_read_at),
        })),
      })
    }

    if (key2 === 'GET conversation') {
      const id = str(req.query.id)
      const { data: conversation, error } = await db
        .from('support_conversations')
        .select('id, subject, status, last_sender, last_message_at, created_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      if (!conversation) throw new HttpError(404, 'Conversation not found.')
      const { data: messages, error: msgError } = await db
        .from('support_messages')
        .select('id, sender, author_name, body, created_at')
        .eq('conversation_id', id)
        .order('created_at')
      if (msgError) throw msgError
      await db.from('support_conversations').update({ customer_read_at: new Date().toISOString() }).eq('id', id)
      return res.status(200).json({ ok: true, conversation, messages: messages ?? [] })
    }

    if (key2 === 'POST conversations') {
      if (!user.email_confirmed_at) throw new HttpError(403, 'Confirm your e-mail address first — check your inbox for our link.')
      // At most 3 new conversations per member per hour (each one e-mails the team).
      const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString()
      const { count: recent } = await db
        .from('support_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', hourAgo)
      if ((recent ?? 0) >= 3) throw new HttpError(429, 'You’ve opened several conversations recently — please continue in one of them.')
      const subject = str(req.body?.subject).slice(0, 200)
      const body = str(req.body?.message)
      if (!subject) throw new HttpError(400, 'Add a subject.')
      if (!body) throw new HttpError(400, 'Write your message.')
      if (body.length > 5000) throw new HttpError(400, 'Your message is too long (5,000 characters max).')
      const { data: conversation, error } = await db
        .from('support_conversations')
        .insert({ user_id: user.id, subject })
        .select('id')
        .single()
      if (error) throw error
      const { error: msgError } = await db
        .from('support_messages')
        .insert({ conversation_id: conversation.id, sender: 'customer', author_id: user.id, author_name: name, body })
      if (msgError) throw msgError
      const hours = await loadHours(db)
      await notifyTeam(req, `${name} <${user.email}>`, subject, body, isOnline(hours))
      return res.status(200).json({ ok: true, id: conversation.id })
    }

    if (key2 === 'POST messages') {
      const id = str(req.body?.conversationId)
      const body = str(req.body?.body)
      if (!body) throw new HttpError(400, 'Write your message.')
      if (body.length > 5000) throw new HttpError(400, 'Your message is too long (5,000 characters max).')
      const { data: conversation, error } = await db
        .from('support_conversations')
        .select('id, subject, last_sender')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      if (!conversation) throw new HttpError(404, 'Conversation not found.')

      // A burst guard: at most 10 messages per member per minute.
      const since = new Date(Date.now() - 60_000).toISOString()
      const { count } = await db
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .gte('created_at', since)
      if ((count ?? 0) >= 10) throw new HttpError(429, 'You’re sending messages too fast — please wait a moment.')

      const now = new Date().toISOString()
      const { error: msgError } = await db
        .from('support_messages')
        .insert({ conversation_id: id, sender: 'customer', author_id: user.id, author_name: name, body })
      if (msgError) throw msgError
      await db
        .from('support_conversations')
        .update({ status: 'open', last_sender: 'customer', last_message_at: now, customer_read_at: now })
        .eq('id', id)

      // E-mail the team only for the first message after their reply, so a
      // live chat doesn't flood the inbox.
      if (conversation.last_sender === 'staff') {
        const hours = await loadHours(db)
        await notifyTeam(req, `${name} <${user.email}>`, conversation.subject, body, isOnline(hours))
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(404).json({ ok: false, error: 'Unknown support action.' })
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ ok: false, error: err.message })
    console.error('[support] error:', err)
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
  }
}
