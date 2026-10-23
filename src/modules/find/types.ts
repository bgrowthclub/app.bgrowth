// A member's public page (BGrowth Find™, Portal migration 0044): their own
// page to promote their work at /p/<slug>. Subscribers only once Plans &
// Subscriptions exist; until then the team builds pages in Admin → Pages.

// 'phone' (call) and 'booking' (a scheduling link) since Sprint 128.
export type MemberPageLinkType = 'whatsapp' | 'whatsapp_group' | 'phone' | 'booking' | 'email' | 'instagram' | 'tiktok' | 'youtube' | 'website' | 'other'

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
  // Since Sprint 145: each service can have its own picture and button — the
  // button opens this service's own address (https).
  image?: string
  url?: string
  // Button text (default: "Learn more"/"Saiba mais").
  cta?: string
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
  // Affiliate Picks (Sprint 131): products the member recommends, each with
  // their own buy link (affiliate code kept as typed).
  | 'products'
  // "Get updates": visitors leave their e-mail for the page's owner
  // (Sprint 139, Portal migration 0065).
  | 'signup'

export type MemberPageProductCategory = 'car' | 'work' | 'home' | 'tech' | 'travel' | 'finance' | 'learning' | 'other'

// A product the member recommends. Everything comes from the member — the
// platform never adds prices, ratings or reviews.
export interface MemberPageProduct {
  title: string
  description?: string
  image?: string
  // The buy link exactly as the member gave it (affiliate code included).
  url: string
  category?: MemberPageProductCategory
  // Shown in "My top picks".
  favorite?: boolean
  // Button text (default: "See product").
  cta?: string
}

export interface MemberPageBlockData {
  title?: string
  body?: string
  // testimonials: quote + name; faq: question (title) + answer (body)
  items?: { title: string; body?: string }[]
  // gallery
  images?: string[]
  // cta: button text; it opens the page's first contact button
  button?: string
  // products: the recommendations; body = the member's own disclosure
  // (a standard one is always shown too)
  products?: MemberPageProduct[]
}

export interface MemberPageBlock {
  id: string
  type: MemberPageBlockType
  hidden?: boolean
  data?: MemberPageBlockData
}

export type MemberPageColor = 'blue' | 'teal' | 'green' | 'purple' | 'rose' | 'orange' | 'navy'

// Page background (light tints only, so dark text stays readable). Open to
// every page, whatever the plan. None = the look's own background.
export type MemberPageBackground = 'cream' | 'mist' | 'sky' | 'mint' | 'blush' | 'lavender' | 'sand'

export interface MemberPageTheme {
  color?: MemberPageColor
  // A wide image behind the top of the page.
  cover?: string
  background?: MemberPageBackground
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
  // The team switched the e-mail list on for this page (promotions etc.).
  signup_granted?: boolean
  created_at: string
  updated_at: string
  // Admin → Pages only: the e-mail of the account linked as owner.
  owner_email?: string | null
}

// Member page numbers (Portal migration 0045): one total per day, kind and
// target. Nothing about the visitors themselves is kept.
export type MemberPageStatKind = 'view' | 'click' | 'course_view' | 'course_lead' | 'signup'

// One person on a page's e-mail list (the owner's list — BGrowth never
// sends to it).
export interface MemberPageSignup {
  id: string
  email: string
  name: string | null
  whatsapp: string | null
  created_at: string
}

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
