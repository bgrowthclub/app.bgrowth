import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Daily reminder for members who signed up but never confirmed their
// e-mail: resends Supabase's sign-up confirmation once on day 1 and once on
// day 3 after sign-up. Scheduled by vercel.json ("crons"), once a day — so
// a member falls inside each one-day window exactly once, and no table is
// needed to remember who was already reminded.
//
// Vercel calls it with "Authorization: Bearer <CRON_SECRET>"; without that
// secret configured nothing runs. Self-contained like the other functions.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, SITE_URL
// (optional, defaults to https://bgrowth.app).

const DAY = 24 * 60 * 60 * 1000
const REMINDER_DAYS = [1, 3]
const PER_PAGE = 1000
const MAX_PAGES = 20

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return res.status(500).json({ ok: false, error: 'Supabase isn’t configured.' })
  const site = (process.env.SITE_URL || 'https://bgrowth.app').replace(/\/$/, '')

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const now = Date.now()
  const due: string[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (error) {
      console.error('[confirmation-reminders] listUsers failed:', error)
      return res.status(500).json({ ok: false, error: error.message })
    }
    for (const user of data.users) {
      if (user.email_confirmed_at || !user.email) continue
      const age = now - new Date(user.created_at).getTime()
      if (REMINDER_DAYS.some((d) => age >= d * DAY && age < (d + 1) * DAY)) due.push(user.email)
    }
    if (data.users.length < PER_PAGE) break
  }

  let sent = 0
  const failed: string[] = []
  for (const email of due) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${site}/verify-email` },
    })
    if (error) {
      failed.push(email)
      console.error('[confirmation-reminders] resend failed:', email, error.message)
    } else {
      sent += 1
    }
  }

  console.log(`[confirmation-reminders] due=${due.length} sent=${sent} failed=${failed.length}`)
  return res.status(200).json({ ok: true, due: due.length, sent, failed: failed.length })
}
