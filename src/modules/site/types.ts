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
