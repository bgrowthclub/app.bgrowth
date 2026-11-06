// The public site's top menu and footer: the built-in version, which Admin
// → Site → Menu & footer can replace (portal.site_content key "navigation").
// Links are a page of this site ("/about") or a full https:// address.

export interface SiteLink {
  label: string
  to: string
}

export type SocialNetwork = 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'tiktok' | 'pinterest' | 'whatsapp' | 'threads' | 'x' | 'telegram' | 'snapchat' | 'spotify'

export const SOCIAL_NETWORKS: { id: SocialNetwork; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'threads', label: 'Threads' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'spotify', label: 'Spotify / Podcast' },
]

export interface SiteNavigation {
  /** Top menu of the public site. */
  menu: SiteLink[]
  /** Footer, "Explore" column. */
  footerLinks: SiteLink[]
  /** Footer, bottom row (legal pages, contact). */
  legalLinks: SiteLink[]
  /** Footer, the sentence under the logo. */
  tagline: string
  /** Footer, the line above the newsletter field. */
  newsletterText: string
  /** Footer icons; an empty address hides that network. */
  socials: Partial<Record<SocialNetwork, string>>
}

export const DEFAULT_NAVIGATION: SiteNavigation = {
  // Four items (05/11/2026), the owner's choice: the products live inside
  // "Solutions" rather than at the top, so the ones still being built don't
  // take a place in the menu. "Solutions" is a same-page anchor on the
  // homepage — it points at the three pillars, and ScrollToTop handles the
  // hash. Journeys moved into the Operate pillar.
  menu: [
    { label: 'Explore', to: '/systems' },
    { label: 'Solutions', to: '/#solutions' },
    { label: 'Knowledge', to: '/knowledge' },
    { label: 'About', to: '/about' },
  ],
  footerLinks: [
    { label: 'Business Systems', to: '/systems' },
    { label: 'Life Worlds', to: '/workspaces' },
    { label: 'Journeys', to: '/journeys' },
    { label: 'Resources', to: '/resources' },
    { label: 'About', to: '/about' },
  ],
  legalLinks: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Contact', to: '/contact' },
  ],
  tagline: 'Interactive Workspaces™ that help you organize, learn, plan and accomplish meaningful goals.',
  newsletterText: 'Get new resources and systems first.',
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com',
  },
}

// Pages of this site to pick from when editing a link.
export const SITE_PAGE_SUGGESTIONS = [
  '/',
  '/systems',
  '/workspaces',
  // The three pillars on the homepage; '/#life-worlds' now lives on
  // /workspaces, which has its own entry above.
  '/#solutions',
  '/knowledge',
  '/journeys',
  '/academy',
  '/resources',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/refund-policy',
  '/login',
  '/register',
]

export function isExternalLink(to: string) {
  return /^https:\/\//i.test(to)
}
