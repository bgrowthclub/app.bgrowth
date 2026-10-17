// Site announcements and Home highlights (Portal migration 0046), managed
// in Admin → Site.

export type AnnouncementTone = 'news' | 'promo' | 'notice'

export interface SiteAnnouncement {
  id: string
  title: string
  body: string
  link_url: string | null
  link_label: string | null
  tone: AnnouncementTone
  show_banner: boolean
  show_bell: boolean
  active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

// A piece of the site edited in Admin → Site (Portal migration 0053,
// portal.site_content). No row = the site shows its built-in text.
export interface SiteContentRow<T = unknown> {
  value: T
  updated_at: string
  updated_by: string | null
}
