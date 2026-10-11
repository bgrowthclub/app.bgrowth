import { supabase } from '../identity/supabase/supabaseClient'
import type { MemberPage, MemberPageStats } from './types'

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
  return ((data ?? [])[0] as MemberPage | undefined) ?? null
}

// Labels a page shows in its own language.
export const MEMBER_PAGE_LABELS = {
  en: { services: 'Services', highlights: 'Featured', about: 'About', contact: 'Get in touch', learnMore: 'Learn more', madeWith: 'Made with BGrowth', notFound: 'This page isn’t available.' },
  pt: { services: 'Serviços', highlights: 'Destaques', about: 'Sobre', contact: 'Fale comigo', learnMore: 'Saiba mais', madeWith: 'Feito com BGrowth', notFound: 'Esta página não está disponível.' },
} as const

// A link as something a phone can open: e-mail → mailto:, WhatsApp → wa.me.
export function memberLinkHref(type: string, url: string): string {
  const value = url.trim()
  if (type === 'email') return value.startsWith('mailto:') ? value : `mailto:${value}`
  if (type === 'whatsapp') {
    if (/^https?:\/\//.test(value)) return value
    const digits = value.replace(/\D/g, '')
    return `https://wa.me/${digits}`
  }
  return /^https?:\/\//.test(value) ? value : `https://${value}`
}

const DEFAULT_LINK_LABELS: Record<string, { en: string; pt: string }> = {
  whatsapp: { en: 'WhatsApp', pt: 'WhatsApp' },
  email: { en: 'E-mail', pt: 'E-mail' },
  instagram: { en: 'Instagram', pt: 'Instagram' },
  tiktok: { en: 'TikTok', pt: 'TikTok' },
  youtube: { en: 'YouTube', pt: 'YouTube' },
  website: { en: 'Website', pt: 'Site' },
  other: { en: 'Link', pt: 'Link' },
}

// The button text: the label written for it, or the network's name.
export function memberLinkLabel(link: { type: string; label: string }, language: 'en' | 'pt'): string {
  return link.label.trim() || (DEFAULT_LINK_LABELS[link.type] ?? DEFAULT_LINK_LABELS.other)[language]
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
