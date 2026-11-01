import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Public actions for member pages and the "Inglês de Mudança" course (a
// separate app served at bgrowth.app/p/bruno/ingles-de-mudanca), run with
// the site's own server settings — the course project needs no Supabase
// keys of its own. (One function for all of them: the Vercel plan caps the
// number of functions.)
//
//   POST lead      { email, name?, movingWhen?, source?, page? } — adds the
//                   e-mail to portal.ingles_leads (Portal migration 0043); an
//                   e-mail already on the list counts as success. A new
//                   e-mail also counts on the creator's page numbers.
//   GET  creator   ?slug=  — the creator's published member page (public
//                   data: name, headline, photo, links) for "Quem criou".
//   POST track     { slug, kind: view|click|course_view|search|search_empty|
//                   category, target? } — adds
//                   one to the page's numbers for today (Portal migration
//                   0045). Only totals are kept, nothing about the visitor.
//   POST search    { q, results } — what was typed in the catalog search and
//                   whether anything matched; daily totals only (Portal
//                   migration 0052), the future Product Discovery's data.
//
// Self-contained (no relative imports), like the other functions.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

type Db = SupabaseClient<any, 'portal', any>

const MOVING_WHEN = ['ja-moro', 'ate-3-meses', '3-12-meses', 'sem-data']
// 'search'/'search_empty' carry what a visitor typed in the page's own
// product search, 'category' which category chip they opened (01/11/2026).
// The term is normalized and dropped if it looks personal (an e-mail, a long
// number) by portal.track_member_page itself — Portal migration 0074.
const TRACK_KINDS = ['view', 'click', 'course_view', 'search', 'search_empty', 'category']
const TRACK_WITH_TARGET = ['click', 'search', 'search_empty', 'category']
const SIGNUP_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

// The course lives at /p/bruno/ingles-de-mudanca and asks for the page
// "bruno"; Bruno's page moved to /p/growwithbruno (19/10/2026). A slug that
// isn't a page's own resolves through this list, then through the page's
// old addresses (previous_slugs, Portal migration 0063).
const SLUG_ALIASES: Record<string, string> = { bruno: 'growwithbruno' }

async function resolveSlug(db: Db, slug: string): Promise<string> {
  const { data } = await db.from('member_pages').select('slug').eq('slug', slug).limit(1)
  if (data && data.length) return slug
  if (SLUG_ALIASES[slug]) return SLUG_ALIASES[slug]
  const moved = await db.from('member_pages').select('slug').contains('previous_slugs', [slug]).limit(1)
  return !moved.error && moved.data?.length ? (moved.data[0] as { slug: string }).slug : slug
}

// Counting never breaks the page: before migration 0045 (or on any error)
// it simply doesn't count.
async function track(db: Db, slug: string, kind: string, target = '') {
  try {
    const { error } = await db.rpc('track_member_page', { p_slug: slug, p_kind: kind, p_target: target })
    if (error) console.warn('[pages] not counted:', error.message)
  } catch (err) {
    console.warn('[pages] not counted:', err)
  }
}

// E-mail list on member pages (Sprint 139, Portal migration 0065). Kept for
// the page's owner — BGrowth never sends to it. Open on pages with a visible
// "signup" section whose owner's plan covers the whole page, team-made pages,
// or pages the team switched on (signup_granted).
//   POST page-signup { slug, email, name?, whatsapp?, consent: true, captchaToken? }
async function captchaOk(req: VercelRequest): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  const token = str(req.body?.captchaToken, 4000)
  if (!token) return false
  try {
    const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
    const body = new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) })
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    return Boolean(((await res.json()) as { success?: boolean }).success)
  } catch {
    return false
  }
}

async function pageSignup(req: VercelRequest, db: Db) {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
  const asked = str(body.slug, 40).toLowerCase()
  const slug = await resolveSlug(db, asked)
  // Site closed: only pages open to visitors take sign-ups.
  if (!(await pageOpenToVisitors(db, asked, slug))) throw new HttpError(404, 'This page isn’t taking sign-ups.')
  const email = str(body.email, 200).toLowerCase()
  if (!SIGNUP_EMAIL.test(email)) throw new HttpError(400, 'Write a valid e-mail.')
  if (body.consent !== true) throw new HttpError(400, 'Tick the box to agree to receive e-mails.')
  if (!(await captchaOk(req))) throw new HttpError(400, 'Please try again.')
  const { data: page } = await db
    .from('member_pages')
    .select('id, slug, user_id, owner_managed, signup_granted, blocks')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  const p = page as { id: string; slug: string; user_id: string | null; owner_managed: boolean; signup_granted: boolean; blocks: { type: string; hidden?: boolean }[] | null } | null
  if (!p || !(p.blocks ?? []).some((b) => b.type === 'signup' && !b.hidden)) throw new HttpError(404, 'This page isn’t taking sign-ups.')
  let allowed = !p.owner_managed || p.signup_granted
  if (!allowed && p.user_id) {
    const { data } = await db.rpc('member_page_level', { p_user: p.user_id })
    allowed = data === 'full'
  }
  if (!allowed) throw new HttpError(404, 'This page isn’t taking sign-ups.')
  const { error } = await db.from('member_page_signups').insert({
    page_id: p.id,
    email,
    name: str(body.name, 120) || null,
    whatsapp: str(body.whatsapp, 40) || null,
  })
  // 23505 = already on this page's list: fine.
  if (error && (error as { code?: string }).code !== '23505') throw error
  if (!error) await track(db, p.slug, 'signup')
  return { ok: true }
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function str(value: unknown, max = 200) {
  // A query value repeated after a rewrite arrives as an array: take the first.
  const v = Array.isArray(value) ? value[0] : value
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

// Link-preview bots (same list as vercel.json's rewrite).
const PREVIEW_BOT = /facebookexternalhit|Facebot|meta-externalagent|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|redditbot|SkypeUriPreview|Iframely|Embedly|vkShare|Snapchat|bitlybot|Tumblr/

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
  const page = str(body.page, 40).toLowerCase()
  if (!error && SLUG.test(page)) await track(db, await resolveSlug(db, page), 'course_lead')
  return { ok: true }
}

async function trackEvent(req: VercelRequest, db: Db) {
  // sendBeacon posts text/plain: the body may arrive as a string.
  const raw = typeof req.body === 'string' ? safeJson(req.body) : req.body
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const slug = str(body.slug, 40).toLowerCase()
  const kind = str(body.kind, 20)
  if (!SLUG.test(slug) || !TRACK_KINDS.includes(kind)) return { ok: true }
  const target = TRACK_WITH_TARGET.includes(kind) ? str(body.target, 120) : ''
  const resolved = await resolveSlug(db, slug)
  // Site closed: visits to pages visitors can't see aren't counted.
  if (!(await pageOpenToVisitors(db, slug, resolved))) return { ok: true }
  await track(db, resolved, kind, target)
  return { ok: true }
}

// Catalog searches (Portal migration 0052). Never breaks the page: before
// the migration (or on any error) it simply doesn't count.
async function trackSearch(req: VercelRequest, db: Db) {
  const raw = typeof req.body === 'string' ? safeJson(req.body) : req.body
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const q = str(body.q, 100)
  const results = typeof body.results === 'number' && Number.isFinite(body.results) ? Math.max(0, Math.floor(body.results)) : 0
  if (q.length < 2) return { ok: true }
  try {
    const { error } = await db.rpc('record_site_search', { p_query: q, p_results: results })
    if (error) console.warn('[search] not counted:', error.message)
  } catch (err) {
    console.warn('[search] not counted:', err)
  }
  return { ok: true }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function getCreator(req: VercelRequest, db: Db) {
  const slug = str(req.query.slug, 40).toLowerCase()
  if (!SLUG.test(slug)) throw new HttpError(400, 'Missing page.')
  const resolved = await resolveSlug(db, slug)
  // Site closed: only pages open to visitors (the course asks for "bruno").
  if (!(await pageOpenToVisitors(db, slug, resolved))) return { creator: null }
  const { data, error } = await db
    .from('member_pages')
    .select('display_name, headline, bio, photo_url, links')
    .eq('slug', resolved)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return { creator: data ?? null }
}

// Is the site open to everyone, or only to the team ("Coming soon")?
// portal.site_settings key "site_open" (set in Admin → Site). No row = closed.
async function getSiteOpen(db: Db) {
  const { data, error } = await db.from('site_settings').select('value').eq('key', 'site_open').maybeSingle()
  if (error) throw error
  return { open: data?.value === true, pages: await openPageSlugs(db) }
}

// ---------------------------------------------------------------------------
// What visitors may reach while the site is closed — the same rule as the
// browser's src/lib/siteAccess.ts (keep both in step). Used here so link
// previews, page sign-ups, visit counts and "Quem criou" don't show or take
// anything for pages visitors can't see. Not data protection: published
// rows are still readable from Supabase with the public key (Layer B).
const ALWAYS_OPEN_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/newsletter',
  '/privacy',
  '/terms',
  '/refund-policy',
  // The Knowledge hub (30/10/2026): articles are what brings people in from
  // search before launch, so the whole section opens — the list and every
  // article. An article is free unless the team marks it (Portal migration
  // 0072), because the gate would send a visitor to /register, which stays
  // closed.
  '/knowledge',
  '/t',
  // Bruno's course (/p/bruno/ingles-de-mudanca). Member pages — Bruno's and
  // Gika's included — open through openPageSlugs() (released + BGrowth Demos,
  // Portal migration 0067, applied 24/10/2026), not through this list.
  '/p/bruno',
  '/ingles-de-mudanca',
]

function isAlwaysOpenPath(path: string) {
  return ALWAYS_OPEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
}

// The site's state for this request: open, plus the released pages'
// addresses. Any error counts as closed with nothing released.
async function siteState(db: Db): Promise<{ open: boolean; pages: string[] }> {
  try {
    const { data, error } = await db.from('site_settings').select('value').eq('key', 'site_open').maybeSingle()
    if (error) return { open: false, pages: [] }
    if (data?.value === true) return { open: true, pages: [] }
    return { open: false, pages: await openPageSlugs(db) }
  } catch {
    return { open: false, pages: [] }
  }
}

// A visitor's address, cleaned: one leading slash, no query/hash, no
// trailing slash. Anything odd ("..", "//", backslashes) → null = closed.
function cleanPath(asked: string): string | null {
  const raw = '/' + asked.replace(/^\/+/, '').split(/[?#]/)[0]
  if (/(^|\/)\.\.?(\/|$)|\/\/|\\/.test(raw)) return null
  return raw.length > 1 ? raw.replace(/\/+$/, '') : raw
}

function pathOpenToVisitors(path: string | null, state: { open: boolean; pages: string[] }) {
  if (state.open) return true
  if (!path) return false
  if (isAlwaysOpenPath(path)) return true
  const slug = /^\/p\/([^/]+)$/.exec(path)?.[1]?.toLowerCase()
  return Boolean(slug && state.pages.includes(slug))
}

// A member page asked for by slug (asked = as typed, resolved = its current
// address): open when the site is, or when either address is open.
async function pageOpenToVisitors(db: Db, asked: string, resolved: string) {
  const state = await siteState(db)
  return pathOpenToVisitors(`/p/${asked}`, state) || pathOpenToVisitors(`/p/${resolved}`, state)
}

// Member pages the team released before launch (Admin → Pages, key
// 'open_pages', Sprint 145): their addresses (current and old ones) open to
// everyone while the rest of the site is closed — published pages only.
async function openPageSlugs(db: Db): Promise<string[]> {
  try {
    // Released in Admin → Pages ('open_pages')…
    const { data } = await db.from('site_settings').select('value').eq('key', 'open_pages').maybeSingle()
    const ids = (data?.value as { ids?: unknown } | null)?.ids
    const list = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)).slice(0, 500) : []
    type Row = { slug: string; previous_slugs?: string[] | null; owner_managed?: boolean; user_id?: string | null }
    const released = list.length ? await db.from('member_pages').select('*').in('id', list).eq('status', 'published') : { data: [], error: null }
    // …and BGrowth Demos (member_pages.is_demo, Portal migration 0067). Before
    // 0067 the column is missing: the query errors and counts as none.
    const demos = await db.from('member_pages').select('*').eq('is_demo', true).eq('status', 'published')
    const rows = [...((released.error ? [] : released.data ?? []) as Row[]), ...((demos.error ? [] : demos.data ?? []) as Row[])]
    // Same as the database rule (0062/0067): a subscriber's page counts only
    // while their plan includes a page — so the site never opens an address
    // whose data the database would hide.
    const levels = new Map<string, boolean>()
    for (const r of rows) {
      if (!r.owner_managed || !r.user_id || levels.has(r.user_id)) continue
      const { data: level, error } = await db.rpc('member_page_level', { p_user: r.user_id })
      levels.set(r.user_id, !error && (level === 'partial' || level === 'full'))
    }
    const visible = rows.filter((r) => !r.owner_managed || (r.user_id ? levels.get(r.user_id) === true : false))
    return [...new Set(visible.flatMap((p) => [p.slug, ...(p.previous_slugs ?? [])]))]
  } catch {
    return []
  }
}

// Link previews (Website Sprint 102): WhatsApp, Facebook/Instagram,
// LinkedIn, X and other preview bots don't run the site's JavaScript, so
// vercel.json sends only them here for every page address. They get a tiny
// page with the right title, description and image: a product's, bundle's
// or member page's own, else Admin → Site → SEO (portal.site_content key
// "seo"), else the site's defaults. People never land here.
const OG_SITE = 'https://bgrowth.app'
const OG_DEFAULT_TITLE = 'BGrowth — Business Systems That Help You Grow Anywhere'
const OG_DEFAULT_DESCRIPTION =
  'Interactive Workspaces, planners and ready-to-use kits that help you organize, plan and grow your business, career and life.'

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

type SeoRow = { defaultImage?: string; pages?: Record<string, { title?: string; description?: string; image?: string }> }

async function linkPreview(req: VercelRequest, db: Db) {
  // The page address: ?path= from the rewrite, else the address the bot asked for.
  const asked = str(req.query.path, 300) || (req.url && !req.url.startsWith('/api/') ? req.url : '')
  const cleaned = cleanPath(asked)
  const path = cleaned ?? '/'

  // Site closed: an address visitors can't see gets the generic "Coming
  // soon" preview — no product, page or article details (Layer A, 23/10/2026).
  if (!pathOpenToVisitors(cleaned, await siteState(db))) return comingSoonPreview()

  const { data: seoRow } = await db.from('site_content').select('value').eq('key', 'seo').eq('locale', 'en').maybeSingle()
  const seo = ((seoRow as { value?: SeoRow } | null)?.value ?? {}) as SeoRow
  const custom = seo.pages?.[path]
  let title = custom?.title ? `${custom.title} | BGrowth` : OG_DEFAULT_TITLE
  let description = custom?.description || OG_DEFAULT_DESCRIPTION
  let image = custom?.image || seo.defaultImage || ''

  const product = /^\/(product|bundle)\/([a-z0-9-]{1,120})$/.exec(path)
  const member = /^\/p\/([a-z0-9-]{1,40})$/.exec(path)
  const article = /^\/knowledge\/article\/([a-z0-9-]{1,200})$/.exec(path)
  if (article) {
    // Knowledge articles published from Studio (Portal migration 0054).
    const { data } = await db.from('knowledge_articles').select('title, excerpt, featured_image, seo').eq('slug', article[1]).maybeSingle()
    const a = data as { title?: string; excerpt?: string | null; featured_image?: string | null; seo?: { title?: string; metaDescription?: string; ogImage?: string } | null } | null
    if (a?.title) {
      title = `${a.seo?.title || a.title} | BGrowth`
      description = a.seo?.metaDescription || a.excerpt || description
      image = a.seo?.ogImage || a.featured_image || image
    }
  } else if (product) {
    const { data } = await db
      .from('products')
      .select('name, short_description, cover_image_url')
      .eq('slug', product[2])
      .eq('status', 'published')
      .maybeSingle()
    const p = data as { name?: string; short_description?: string | null; cover_image_url?: string | null } | null
    if (p?.name) {
      title = `${p.name} | BGrowth`
      description = p.short_description || description
      image = p.cover_image_url || image
    }
  } else if (member) {
    let { data } = await db.from('member_pages').select('display_name, headline, photo_url').eq('slug', member[1]).eq('status', 'published').maybeSingle()
    if (!data) {
      // An old address of a page that moved (Portal migration 0063).
      const moved = await db.from('member_pages').select('display_name, headline, photo_url').contains('previous_slugs', [member[1]]).eq('status', 'published').limit(1)
      data = moved.error ? null : ((moved.data ?? [])[0] ?? null)
    }
    const m = data as { display_name?: string; headline?: string | null; photo_url?: string | null } | null
    if (m?.display_name) {
      title = `${m.display_name} | BGrowth`
      description = m.headline || `${m.display_name} on BGrowth`
      image = m.photo_url || image
    }
  }

  const url = `${OG_SITE}${path === '/' ? '' : path}`
  const t = escapeHtml(title)
  const d = escapeHtml(description.slice(0, 300))
  const tags = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="BGrowth">',
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}">` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : '',
  ].filter(Boolean)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${tags.join('')}</head><body><h1>${t}</h1><p>${d}</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p></body></html>`
}

// The preview for addresses visitors can't see while the site is closed.
function comingSoonPreview() {
  const t = escapeHtml('BGrowth — Coming soon')
  const d = escapeHtml('BGrowth is getting ready. Leave your e-mail at bgrowth.app to know the day we open.')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${t}</title><meta name="robots" content="noindex, nofollow"><meta name="description" content="${d}"><meta property="og:type" content="website"><meta property="og:site_name" content="BGrowth"><meta property="og:title" content="${t}"><meta property="og:description" content="${d}"><meta property="og:url" content="${OG_SITE}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${t}"><meta name="twitter:description" content="${d}"></head><body><h1>${t}</h1><p>${d}</p></body></html>`
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
    let action = str(req.query.action)
    // A preview bot sent here by vercel.json without the query (it can be
    // replaced by the page's own ?…): still answer with the link preview.
    if (!action && req.method === 'GET' && PREVIEW_BOT.test(String(req.headers['user-agent'] ?? ''))) action = 'og'
    if (req.method === 'POST' && action === 'lead') return res.status(200).json(await saveLead(req, db))
    if (req.method === 'POST' && action === 'page-signup') return res.status(200).json(await pageSignup(req, db))
    if (req.method === 'POST' && action === 'track') return res.status(200).json(await trackEvent(req, db))
    if (req.method === 'POST' && action === 'search') return res.status(200).json(await trackSearch(req, db))
    if (req.method === 'GET' && action === 'site') {
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
      return res.status(200).json(await getSiteOpen(db))
    }
    if (req.method === 'GET' && action === 'og') {
      const html = await linkPreview(req, db)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
      return res.status(200).send(html)
    }
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
