import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// The "Inglês de Mudança" course (a separate app served at
// bgrowth.app/p/bruno/ingles-de-mudanca) talks to the database through
// here, with the site's own server settings — the course project needs no
// Supabase keys of its own.
//
//   POST lead      { email, name?, movingWhen?, source? } — adds the e-mail
//                   to portal.ingles_leads (Portal migration 0043); an
//                   e-mail already on the list counts as success.
//   GET  creator   ?slug=  — the creator's published member page (public
//                   data: name, headline, photo, links) for "Quem criou".
//
// Self-contained (no relative imports), like the other functions.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

type Db = SupabaseClient<any, 'portal', any>

const MOVING_WHEN = ['ja-moro', 'ate-3-meses', '3-12-meses', 'sem-data']

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function str(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

async function saveLead(req: VercelRequest, db: Db) {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
  // Honeypot: a hidden field only bots fill in.
  if (str(body.website)) return { ok: true }
  const email = str(body.email, 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Confira o e-mail.')
  const movingWhen = str(body.movingWhen, 20)
  const { error } = await db.from('ingles_leads').insert({
    email,
    name: str(body.name, 120) || null,
    moving_when: MOVING_WHEN.includes(movingWhen) ? movingWhen : null,
    source: str(body.source, 60) || null,
  })
  // 23505 = this e-mail is already on the list: fine, unlock anyway.
  if (error && (error as { code?: string }).code !== '23505') throw error
  return { ok: true }
}

async function getCreator(req: VercelRequest, db: Db) {
  const slug = str(req.query.slug, 40).toLowerCase()
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new HttpError(400, 'Missing page.')
  const { data, error } = await db
    .from('member_pages')
    .select('display_name, headline, bio, photo_url, links')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return { creator: data ?? null }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Public, harmless actions: the course's own Vercel address may call them too.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new HttpError(500, 'Not configured.')
    const db = createClient(url, key, { db: { schema: 'portal' }, auth: { persistSession: false, autoRefreshToken: false } }) as Db
    const action = str(req.query.action)
    if (req.method === 'POST' && action === 'lead') return res.status(200).json(await saveLead(req, db))
    if (req.method === 'GET' && action === 'creator') {
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      return res.status(200).json(await getCreator(req, db))
    }
    return res.status(404).json({ ok: false, error: 'Unknown action.' })
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ ok: false, error: err.message })
    console.error('[ingles] error:', err)
    return res.status(500).json({ ok: false, error: 'Não deu para salvar agora.' })
  }
}
