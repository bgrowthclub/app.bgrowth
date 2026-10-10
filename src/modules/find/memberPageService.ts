import { supabase } from '../identity/supabase/supabaseClient'
import type { MemberPage } from './types'

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
  en: { services: 'Services', highlights: 'Featured', about: 'About', contact: 'Get in touch', madeWith: 'Made with BGrowth', notFound: 'This page isn’t available.' },
  pt: { services: 'Serviços', highlights: 'Destaques', about: 'Sobre', contact: 'Fale comigo', madeWith: 'Feito com BGrowth', notFound: 'Esta página não está disponível.' },
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
