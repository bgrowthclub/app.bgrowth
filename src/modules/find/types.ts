// A member's public page (BGrowth Find™, Portal migration 0044): their own
// page to promote their work at /p/<slug>. Subscribers only once Plans &
// Subscriptions exist; until then the team builds pages in Admin → Pages.

// 'phone' (call) and 'booking' (a scheduling link) since Sprint 128.
export type MemberPageLinkType = 'whatsapp' | 'phone' | 'booking' | 'email' | 'instagram' | 'tiktok' | 'youtube' | 'website' | 'other'

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

// Since Sprint 127 (Portal migration 0062) a page is a list of blocks the
// subscriber (or the team) orders, hides and fills. The person's own data
// (name, photo, contacts, services, featured work, about) stays in the
// page's fields; blocks with their own content keep it in `data`.
export type MemberPageBlockType =
  | 'hero'
  | 'contact'
  | 'highlights'
  | 'services'
  | 'about'
  | 'testimonials'
  | 'gallery'
  | 'text'
  | 'faq'
  | 'area'
  | 'cta'
  // Licenses, certifications, insurance — shown as stated by the member,
  // with a note that BGrowth hasn't verified them (Sprint 128).
  | 'credentials'

export interface MemberPageBlockData {
  title?: string
  body?: string
  // testimonials: quote + name; faq: question (title) + answer (body)
  items?: { title: string; body?: string }[]
  // gallery
  images?: string[]
  // cta: button text; it opens the page's first contact button
  button?: string
}

export interface MemberPageBlock {
  id: string
  type: MemberPageBlockType
  hidden?: boolean
  data?: MemberPageBlockData
}

export type MemberPageColor = 'blue' | 'teal' | 'green' | 'purple' | 'rose' | 'orange' | 'navy'

export interface MemberPageTheme {
  color?: MemberPageColor
  // A wide image behind the top of the page.
  cover?: string
}

// What the subscriber's plan lets them do with their page.
export type MemberPageLevel = 'partial' | 'full'

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
  template?: string | null
  blocks?: MemberPageBlock[] | null
  theme?: MemberPageTheme | null
  owner_managed?: boolean
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

// What the page editor (MemberPageBuilder) saves — the team's (Admin →
// Pages) and the subscriber's (My Page).
export interface MemberPageDraft {
  id?: string
  slug: string
  displayName: string
  headline: string
  bio: string
  photoUrl: string
  location: string
  links: MemberPageLink[]
  services: MemberPageService[]
  highlights: MemberPageHighlight[]
  language: MemberPage['language']
  status: MemberPage['status']
  // Sent by the block editor (Sprint 127); absent = keep the page's own.
  template?: string
  blocks?: MemberPageBlock[]
  theme?: MemberPageTheme
}
