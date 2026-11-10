import { supabase } from '../identity/supabase/supabaseClient'
import type { MemberPage, MemberPageDraft, MemberPageLevel, MemberPageLink, MemberPageSignup, MemberPageStats, MemberPageSummary } from './types'

// Reads a published member page (row-level security only returns
// published ones). Writes go through api/admin.ts.
export async function getPublishedMemberPage(slug: string): Promise<MemberPage | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('member_pages').select('*').eq('slug', slug).eq('status', 'published').limit(1)
  if (error) {
    // Before Portal migration 0044 runs there are simply no pages.
    if (error.code === '42P01' || error.code === 'PGRST205') return null
    throw error
  }
  const page = ((data ?? [])[0] as MemberPage | undefined) ?? null
  if (page) return page
  // An address the page had before (Portal migration 0063): the page it
  // moved to, so the old link keeps working.
  const moved = await supabase.from('member_pages').select('*').contains('previous_slugs', [slug]).eq('status', 'published').limit(1)
  if (moved.error) return null
  return ((moved.data ?? [])[0] as MemberPage | undefined) ?? null
}

// Labels a page shows in its own language.
export const MEMBER_PAGE_LABELS = {
  en: {
    services: 'Services',
    highlights: 'Featured',
    about: 'About',
    contact: 'Get in touch',
    learnMore: 'Learn more',
    // Brand line: the same in every language (shown with translate="no").
    madeWith: 'Powered by BGrowth',
    notFound: 'This page isn’t available.',
    credentials: 'Licenses & credentials',
    credentialsNote: 'As stated by this professional — not verified by BGrowth.',
    disclaimer: 'The information on this page is provided by its owner and isn’t verified by BGrowth.',
    signupTitle: 'Get updates',
    signupButton: 'Sign me up',
    signupEmail: 'Your e-mail',
    signupName: 'Your name (optional)',
    signupWhatsapp: 'WhatsApp (optional)',
    signupConsent: 'I agree to receive e-mails from',
    signupDone: 'You’re on the list. Thank you!',
    signupNote: 'Your contact goes only to the owner of this page. You can ask to be removed at any time.',
    picks: 'My picks',
    topPicks: 'My top picks',
    allPicks: 'All',
    searchPicks: 'Search products…',
    seeProduct: 'See product',
    seePicks: 'See my picks',
    noPicks: 'Nothing here yet.',
    categories: { car: 'Car & Driving', work: 'Work & Business', home: 'Home & Living', tech: 'Tech & Gadgets', travel: 'Travel', finance: 'Money & Finance', learning: 'Learning', other: 'Other' },
  },
  pt: {
    services: 'Serviços',
    highlights: 'Destaques',
    about: 'Sobre',
    contact: 'Fale comigo',
    learnMore: 'Saiba mais',
    madeWith: 'Powered by BGrowth',
    notFound: 'Esta página não está disponível.',
    credentials: 'Licenças e credenciais',
    credentialsNote: 'Informadas pelo profissional — não verificadas pela BGrowth.',
    disclaimer: 'As informações desta página são do seu responsável e não são verificadas pela BGrowth.',
    signupTitle: 'Receba novidades',
    signupButton: 'Quero receber',
    signupEmail: 'Seu e-mail',
    signupName: 'Seu nome (opcional)',
    signupWhatsapp: 'WhatsApp (opcional)',
    signupConsent: 'Aceito receber e-mails de',
    signupDone: 'Pronto, você está na lista. Obrigado!',
    signupNote: 'Seu contato vai só para o dono desta página. Você pode pedir para sair a qualquer momento.',
    picks: 'Minhas indicações',
    topPicks: 'Meus favoritos',
    allPicks: 'Todos',
    searchPicks: 'Buscar produtos…',
    seeProduct: 'Ver produto',
    seePicks: 'Ver minhas indicações',
    noPicks: 'Nada aqui ainda.',
    categories: { car: 'Carro', work: 'Trabalho e negócios', home: 'Casa', tech: 'Tecnologia', travel: 'Viagem', finance: 'Finanças', learning: 'Aprendizado', other: 'Outros' },
  },
} as const

// A link as something a phone can open: e-mail → mailto:, WhatsApp → wa.me.
/**
 * Would this button actually go somewhere? (08/11/2026.) A web address that
 * is only a scheme — "https://" — used to save fine and draw a button that
 * did nothing on click. Saving is now refused, but pages saved before today
 * already carry those, so the views drop them instead of showing a dead
 * button. A phone or WhatsApp with no digits is the same mistake.
 */
export function isUsableLink(type: string, url: string): boolean {
  const value = (url ?? '').trim()
  if (!value) return false
  if (type === 'email') return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value)
  if (type === 'phone' || type === 'whatsapp') {
    return /^https?:\/\//i.test(value) ? /^https?:\/\/[^/\s.]+\.[^/\s]/i.test(value) : value.replace(/\D/g, '').length >= 8
  }
  const full = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return /^https?:\/\/[^/\s.]+\.[^/\s]/i.test(full)
}

/**
 * Where a page's hero (or CTA) button goes — the one that used to be stuck
 * on the first contact button (10/11/2026).
 *
 * Returns the anchor's props, or null when there is nothing to open: the
 * button is then not drawn at all, because a button that goes nowhere is
 * worse than no button.
 */
export function pageButtonProps(
  buttonLink: string | undefined,
  links: MemberPageLink[],
): { href: string; target?: string; rel?: string; scrollTo?: string } | null {
  const value = (buttonLink ?? '').trim()

  // A section of this page: handled by the view, which scrolls to it.
  if (value.startsWith('#')) {
    const id = value.slice(1)
    return id ? { href: value, scrollTo: id } : null
  }

  // One named contact button of this page. Named, not indexed: the member
  // reorders their buttons, and a stored position would quietly start
  // pointing at a different one.
  if (value.startsWith('contact:')) {
    const type = value.slice('contact:'.length)
    const found = links.find((l) => l.type === type && isUsableLink(l.type, l.url))
    return found ? { href: memberLinkHref(found.type, found.url), target: '_blank', rel: 'noreferrer' } : null
  }

  if (value) {
    if (!isUsableLink('website', value)) return null
    return { href: memberLinkHref('website', value), target: '_blank', rel: 'noreferrer' }
  }

  // Nothing chosen: the first contact button that actually works, which is
  // what every page saved before today did.
  const first = links.find((l) => isUsableLink(l.type, l.url))
  return first ? { href: memberLinkHref(first.type, first.url), target: '_blank', rel: 'noreferrer' } : null
}

export function memberLinkHref(type: string, url: string): string {
  const value = url.trim()
  if (type === 'email') return value.startsWith('mailto:') ? value : `mailto:${value}`
  if (type === 'phone') return value.startsWith('tel:') ? value : `tel:${value.replace(/[^\d+]/g, '')}`
  if (type === 'whatsapp') {
    if (/^https?:\/\//.test(value)) return value
    const digits = value.replace(/\D/g, '')
    return `https://wa.me/${digits}`
  }
  return /^https?:\/\//.test(value) ? value : `https://${value}`
}

/**
 * A WhatsApp group invite or a WhatsApp channel (03/11/2026). The button
 * started as groups only; a channel is the shape an affiliate actually uses,
 * and from the visitor's side both are one button — "join me on WhatsApp" —
 * so they share the type and only the wording changes.
 *
 * THE SAME RULE IS COPIED in api/account.ts and api/admin.ts (a function
 * must not import from src/, CLAUDE.md §13). Change all three.
 */
export const WHATSAPP_JOIN_RE = /^https:\/\/(chat\.whatsapp\.com\/|(www\.)?whatsapp\.com\/channel\/)\S+$/i

export function isWhatsAppChannel(url: string): boolean {
  return /^https:\/\/(www\.)?whatsapp\.com\/channel\//i.test(url.trim())
}

const DEFAULT_LINK_LABELS: Record<string, { en: string; pt: string }> = {
  whatsapp: { en: 'WhatsApp', pt: 'WhatsApp' },
  whatsapp_group: { en: 'Join the WhatsApp group', pt: 'Entrar no grupo do WhatsApp' },
  phone: { en: 'Call', pt: 'Ligar' },
  booking: { en: 'Book a time', pt: 'Agendar horário' },
  email: { en: 'E-mail', pt: 'E-mail' },
  instagram: { en: 'Instagram', pt: 'Instagram' },
  tiktok: { en: 'TikTok', pt: 'TikTok' },
  youtube: { en: 'YouTube', pt: 'YouTube' },
  website: { en: 'Website', pt: 'Site' },
  other: { en: 'Link', pt: 'Link' },
}

const WHATSAPP_CHANNEL_LABEL = { en: 'Join the WhatsApp channel', pt: 'Entrar no canal do WhatsApp' }

// The button text: the label written for it, or the network's name. One
// button carries both a WhatsApp group and a WhatsApp channel, so when no
// label was written the address decides which word is true.
export function memberLinkLabel(link: { type: string; label: string; url?: string }, language: 'en' | 'pt'): string {
  const written = link.label.trim()
  if (written) return written
  if (link.type === 'whatsapp_group' && link.url && isWhatsAppChannel(link.url)) return WHATSAPP_CHANNEL_LABEL[language]
  return (DEFAULT_LINK_LABELS[link.type] ?? DEFAULT_LINK_LABELS.other)[language]
}

export interface VideoEmbed {
  src: string
  // Vertical videos (TikTok, Reels, Shorts) take a taller frame.
  vertical: boolean
}

// Turns a YouTube, TikTok or Instagram link into the address of its player.
// Anything else returns null (the link is then simply not shown as video).
export function videoEmbed(link: string): VideoEmbed | null {
  let url: URL
  try {
    url = new URL(link.trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '')
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return id ? { src: `https://www.youtube-nocookie.com/embed/${id}`, vertical: false } : null
  }
  if (host === 'youtube.com') {
    const shorts = url.pathname.match(/^\/(shorts|embed|live)\/([\w-]+)/)
    const id = shorts?.[2] ?? url.searchParams.get('v')
    return id ? { src: `https://www.youtube-nocookie.com/embed/${id}`, vertical: shorts?.[1] === 'shorts' } : null
  }
  if (host === 'tiktok.com') {
    const id = url.pathname.match(/\/video\/(\d+)/)?.[1]
    return id ? { src: `https://www.tiktok.com/embed/v2/${id}`, vertical: true } : null
  }
  if (host === 'instagram.com') {
    const m = url.pathname.match(/^\/(p|reel|reels|tv)\/([\w-]+)/)
    return m ? { src: `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed`, vertical: true } : null
  }
  return null
}

// ---------------------------------------------------------------------------
// Numbers (Portal migration 0045). Counting goes through the site's server
// (api/ingles.ts — the one public function for pages and the course); the
// page's owner reads their own numbers here, under row-level security.
// ---------------------------------------------------------------------------

const TRACK_URL = '/api/ingles?action=track'

function send(body: Record<string, string>) {
  try {
    const payload = JSON.stringify(body)
    if (navigator.sendBeacon?.(TRACK_URL, new Blob([payload], { type: 'text/plain' }))) return
    void fetch(TRACK_URL, { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'application/json' } })
  } catch {
    /* counting never breaks the page */
  }
}

const isAutomated = () => typeof navigator !== 'undefined' && navigator.webdriver === true

// One visit per page per browser session (a reload isn't a new visit).
export function trackMemberPageView(slug: string) {
  if (isAutomated()) return
  const key = `bgrowth.pageview.${slug}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    /* private mode: count anyway */
  }
  send({ slug, kind: 'view' })
}

export function trackMemberPageClick(slug: string, target: string) {
  if (isAutomated()) return
  send({ slug, kind: 'click', target: target.slice(0, 120) })
}

// What visitors look for on the page itself (01/11/2026) — the page's own
// thermometer, next to what they search for in the catalog. A search that
// found nothing is counted apart ('search_empty'), because that is the
// useful half: a product the member doesn't have yet.
//
// Privacy, the same rule the catalog search follows: the term is normalized
// and nothing about the visitor is sent. The server drops a term that looks
// like an e-mail or carries a long number (portal.track_member_page, Portal
// migration 0074) — someone typing their own data into a search box must
// not leave it in our numbers.
export function trackMemberPageSearch(slug: string, query: string, found: boolean) {
  if (isAutomated()) return
  const q = query.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 120)
  if (q.length < 2) return
  // Once per term per browser session: a term typed letter by letter, or
  // searched again after scrolling, is one search.
  if (seenOnce(`bgrowth.pagesearch.${slug}.${found ? 'y' : 'n'}.${q}`)) return
  send({ slug, kind: found ? 'search' : 'search_empty', target: q })
}

/** Which category chips visitors open — once per category per session. */
export function trackMemberPageCategory(slug: string, category: string) {
  if (isAutomated()) return
  const c = category.trim().slice(0, 120)
  if (!c || c === 'all') return
  if (seenOnce(`bgrowth.pagecategory.${slug}.${c}`)) return
  send({ slug, kind: 'category', target: c })
}

/** True if this browser session already counted this key. */
function seenOnce(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return true
    sessionStorage.setItem(key, '1')
  } catch {
    /* private mode: count anyway */
  }
  return false
}

// The signed-in member's own page, if the team linked one to their account.
export async function getMyMemberPage(userId: string): Promise<MemberPage | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('member_pages').select('*').eq('user_id', userId).order('created_at').limit(1)
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return null
    throw error
  }
  return ((data ?? [])[0] as MemberPage | undefined) ?? null
}

export async function getMyMemberPageStats(pageId: string, days: number): Promise<MemberPageStats> {
  if (!supabase) return { rows: [], days, ready: false }
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('member_page_stats')
    .select('day, kind, target, count')
    .eq('page_id', pageId)
    .gte('day', since)
    .order('day')
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return { rows: [], days, ready: false }
    throw error
  }
  return { rows: (data ?? []) as MemberPageStats['rows'], days, ready: true }
}

// The subscriber's own page (Sprint 127): read and saved through
// api/account.ts, which applies what their plan allows.
async function accountCall<T>(method: 'GET' | 'PUT' | 'POST' | 'DELETE', resource: string, body?: unknown): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (!session) throw new Error('Sign in to continue.')
  const response = await fetch(`/api/account?resource=${resource}`, {
    method,
    headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T
  if (!response.ok || !json.ok) throw new Error(json.error ?? `Request failed (${response.status}).`)
  return json
}

/**
 * May this page be listed in search? Free and Starter pages are kept out
 * (08/11/2026, the owner's decision) — the rule lives in
 * portal.member_page_indexable(), so the site can't disagree with it.
 *
 * On any error, or on a database that hasn't had 0079 applied, the answer
 * is "yes": that is exactly how every page behaved before this existed, so
 * a glitch never quietly drops a paying member out of Google.
 */
export interface MemberPageViewRules {
  template: string | null
  level: string | null
  indexable: boolean
}

/**
 * How this page must be shown under its owner's plan today (08/11/2026,
 * Portal migration 0082): which model, how much of it, and whether search
 * engines may list it.
 *
 * On any error, or a database without 0082, the answer is null and the page
 * is drawn exactly as it is stored — which is how it behaved before this
 * existed. A glitch must never silently strip someone's page.
 */
export async function getMemberPageViewRules(pageId: string): Promise<MemberPageViewRules | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('member_page_view_rules', { p_page: pageId })
  if (error) return null
  const row = (Array.isArray(data) ? data[0] : data) as MemberPageViewRules | undefined
  return row ?? null
}

export async function isMemberPageIndexable(pageId: string): Promise<boolean> {
  if (!supabase) return true
  const { data, error } = await supabase.rpc('member_page_indexable', { p_page: pageId })
  if (error || typeof data !== 'boolean') return true
  return data
}

/** A visitor reporting a page (08/11/2026). Nothing about them is sent. */
export async function reportMemberPage(slug: string, reason: string, detail: string): Promise<void> {
  await fetch('/api/ingles?action=page-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, reason, detail }),
  })
}

export const myPageService = {
  // Without an id: the member's first page, plus the list and how many they
  // may have (07/11/2026). With one: that page opened for editing.
  get(id?: string) {
    return accountCall<{
      level: MemberPageLevel | null
      templates?: string[] | null
      selfService?: boolean
      // What visitors looked for: the plan includes it, or the team switched
      // it on for this page (01/11/2026).
      insights?: boolean
      // How many pages the plan plus the team's grant allow.
      allowance?: number
      // Contact buttons the plan shows (null = no limit).
      linkLimit?: number | null
      pages?: MemberPageSummary[]
      page: MemberPage | null
    }>('GET', id ? `my-page&page=${encodeURIComponent(id)}` : 'my-page')
  },
  // `id` says which page is being saved; without it, a new one is created
  // (the endpoint refuses it past the allowance).
  async save(draft: MemberPageDraft, id?: string) {
    return (await accountCall<{ page: MemberPage }>('PUT', 'my-page', id ? { ...draft, id } : draft)).page
  },
  // Which pages stay online, in order of preference (08/11/2026).
  async keepPages(ids: string[]) {
    await accountCall('PUT', 'my-pages-keep', { ids })
  },
  async uploadImage(dataUrl: string) {
    return (await accountCall<{ url: string }>('POST', 'my-page-image', { dataUrl })).url
  },
  async signups() {
    return (await accountCall<{ signups: MemberPageSignup[] }>('GET', 'my-page-signups')).signups
  },
  async removeSignup(id: string) {
    await accountCall('DELETE', `my-page-signups&id=${encodeURIComponent(id)}`)
  },
}

// A visitor joins a page's e-mail list (api/ingles.ts, action page-signup).
export async function joinMemberPageList(input: { slug: string; email: string; name: string; whatsapp: string; captchaToken?: string }) {
  const response = await fetch('/api/ingles?action=page-signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, consent: true }),
  })
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
  if (!response.ok || !data.ok) throw new Error(data.error || 'Couldn’t sign you up. Try again.')
}
