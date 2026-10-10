// A member's public page (BGrowth Find™, Portal migration 0044): their own
// page to promote their work at /p/<slug>. Subscribers only once Plans &
// Subscriptions exist; until then the team builds pages in Admin → Pages.

export type MemberPageLinkType = 'whatsapp' | 'email' | 'instagram' | 'tiktok' | 'youtube' | 'website' | 'other'

export interface MemberPageLink {
  type: MemberPageLinkType
  label: string
  // A full URL; for e-mail and WhatsApp the address/number is turned into one.
  url: string
}

export interface MemberPageService {
  title: string
  description?: string
  price?: string
}

// Featured work — a product, a course, a portfolio piece.
export interface MemberPageHighlight {
  title: string
  description?: string
  url?: string
  image?: string
  // A YouTube, TikTok or Instagram link — the video plays on the page while
  // staying hosted on that network (no storage on our side).
  video?: string
  // Text of the button that opens `url` (default: "Saiba mais"/"Learn more").
  cta?: string
}

export interface MemberPage {
  id: string
  slug: string
  user_id: string | null
  display_name: string
  headline: string | null
  bio: string | null
  photo_url: string | null
  location: string | null
  services: MemberPageService[]
  highlights: MemberPageHighlight[]
  links: MemberPageLink[]
  language: 'en' | 'pt'
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  // Admin → Pages only: the e-mail of the account linked as owner.
  owner_email?: string | null
}

// Member page numbers (Portal migration 0045): one total per day, kind and
// target. Nothing about the visitors themselves is kept.
export type MemberPageStatKind = 'view' | 'click' | 'course_view' | 'course_lead'

export interface MemberPageStatRow {
  day: string
  kind: MemberPageStatKind
  // 'link:<type>' for a contact button, 'featured:<title>' for a featured
  // item; '' otherwise.
  target: string
  count: number
}

export interface MemberPageStats {
  rows: MemberPageStatRow[]
  days: number
  // false until the database update (migration 0045) runs.
  ready: boolean
}
