import type { StoredPlan } from '../commerce/types/membership'
import type { MemberPage, MemberPageDraft, MemberPageHighlight, MemberPageLink, MemberPageService } from '../find/types'
import type { PortalAccessGrantRow, PortalLicenseRow } from '../workspace/types/portal'
import type { SupportConversationSummary, SupportHours, SupportMessage } from '../support/types'
import type { GrowthCategoryId } from '../../types/growth'

// Shapes returned by the Website's Admin endpoint (api/admin.ts). Licenses
// and grants are the Portal's own rows (types/portal.ts) with their
// product joined — never a second license/grant model.

export interface AdminMemberSummary {
  id: string
  email: string
  fullName: string | null
  createdAt: string
  lastSignInAt: string | null
  emailConfirmed: boolean
  hasUsedTrial: boolean
  purchases: number
  trialActive: boolean
  activeGrants: number
}

export interface AdminMemberPage {
  members: AdminMemberSummary[]
  total: number
  page: number
  pageSize: number
}

export interface AdminProductRef {
  id: string
  name: string
  slug: string
}

export type AdminLicense = PortalLicenseRow & { created_at: string; products: AdminProductRef | null }
export type AdminGrant = PortalAccessGrantRow & {
  id: string
  note: string | null
  granted_by: string | null
  products: AdminProductRef | null
}

export interface AdminMemberDetail {
  member: Omit<AdminMemberSummary, 'purchases' | 'trialActive' | 'activeGrants'>
  licenses: AdminLicense[]
  grants: AdminGrant[]
  // Saved records (workspace_instances) per product id.
  documents: Record<string, number>
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  is_free: boolean
  price_cents: number | null
  currency: string
  last_published_at?: string | null
  content_type?: string
}

// Admin → Catalog → Access (api/admin.ts resource product-members,
// 01/11/2026): who has one product, how they got in and how far along they
// are. The opposite of Admin → Members, which answers one person's products.
export interface AdminProductMember {
  userId: string
  email: string | null
  fullName: string | null
  // 'plan' is not a row per person: it is "everyone on this plan or above".
  source: 'purchase' | 'free' | 'trial' | 'team' | 'plan'
  detail?: string
  since: string | null
  endsAt: string | null
  expired: boolean
  lastOpenedAt: string | null
  // Courses only: 0–100, null when they never ticked a lesson.
  percent: number | null
  records: number
}

export interface AdminProductMembers {
  product: { id: string; name: string; slug: string; contentType: string; isCourse: boolean }
  members: AdminProductMember[]
  totals: { people: number; active: number; expired: number; neverOpened: number; started?: number; finished?: number }
}

export interface NewGrantInput {
  userId: string
  scope: 'specific' | 'all'
  productId?: string
  expiresAt?: string | null
  note?: string
  confirmWarning?: boolean
}

export type CreateGrantResult = { grant: AdminGrant } | { requiresConfirmation: true; warning: string }

// One paid Stripe Checkout (Website or Portal) — amounts in cents.
export interface AdminSale {
  id: string
  createdAt: string
  amount: number
  currency: string
  // Cents refunded so far; null when the Stripe key can't read refunds.
  refunded: number | null
  email: string | null
  userId: string | null
  productSlug: string | null
  productName: string | null
  source: 'website' | 'portal'
  stripeUrl: string | null
}

export interface AdminSalesReport {
  sales: AdminSale[]
  since: string
  months: number
  refundsAvailable: boolean
  truncated: boolean
}

// Admin → Support (the team side of modules/support).
export interface AdminSupportMember {
  email: string
  full_name: string | null
}

export interface AdminSupportConversation extends SupportConversationSummary {
  user_id: string
  users: AdminSupportMember | null
  // The member's plan includes priority support (Sprint 125).
  priority?: boolean
}

export interface AdminSupportInbox {
  hours: SupportHours
  online: boolean
  conversations: AdminSupportConversation[]
  // Open conversations waiting for the team.
  waiting: number
}

export interface AdminSupportThread {
  conversation: AdminSupportConversation & { customer_read_at: string }
  messages: SupportMessage[]
}

// Admin → Categories (Portal migration 0032). An Area has parent_id null;
// a category inside it points at the Area.
export interface AdminCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
  // Its look (Portal migration 0047) — keys of components/systems/
  // categoryIcons.ts; absent before it runs.
  icon?: string | null
  color?: string | null
  cover_image_url?: string | null
}

export interface AdminCatalogProduct {
  id: string
  name: string
  slug: string
  status: string
  category_id: string | null
  cover_image_url: string | null
}

export interface AdminCatalogCategories {
  categories: AdminCategory[]
  products: AdminCatalogProduct[]
}

// Admin → Newsletter (Portal migration 0036). audience_areas empty = every
// subscriber.
export interface AdminNewsletterCampaignSummary {
  id: string
  kind: 'newsletter' | 'launch'
  product_id: string | null
  subject: string
  status: 'draft' | 'sending' | 'sent'
  sent_count: number
  sent_at: string | null
  audience_areas: GrowthCategoryId[]
  created_at: string
  updated_at: string
}

export interface AdminNewsletterCampaign extends AdminNewsletterCampaignSummary {
  preheader: string
  body_html: string
  created_by: string | null
}

// Admin → Newsletter → Wix contacts (Portal migration 0056).
export type WixContactGroup = 'contact' | 'team' | 'spam'

export interface AdminWixContact {
  id: string
  email: string
  name: string | null
  origin: string | null
  grp: WixContactGroup
  was_member: boolean
  had_free_plan: boolean
  unsubscribed_before: boolean
  external_created_at: string | null
  invited_at: string | null
  accepted_at: string | null
  /** Already a newsletter subscriber / has an account here, however they joined. */
  subscribed: boolean
  member: boolean
}

export interface AdminWixContactsOverview {
  ready: boolean
  address: string
  contacts: AdminWixContact[]
}

export interface AdminNewsletterOverview {
  stats: {
    subscribed: number
    pending: number
    unsubscribed: number
    allTopics: number
    byArea: Record<GrowthCategoryId, number>
  }
  areas: { id: GrowthCategoryId; label: string }[]
  campaigns: AdminNewsletterCampaignSummary[]
  // Mailing address shown in every e-mail (US law). Empty blocks sending.
  address: string
}

export interface AdminNewsletterDraft {
  id?: string
  subject: string
  preheader: string
  bodyHtml: string
  audienceAreas: GrowthCategoryId[]
}

// A member's review of a Workspace (portal.reviews), with what Admin → Reviews shows.
export interface AdminReview {
  id: string
  user_id: string
  product_id: string
  rating: number
  title: string
  comment: string
  display_name: string
  created_from: 'trial' | 'purchase' | 'access'
  created_at: string
  updated_at: string
  product_name: string
  product_slug: string | null
  email: string | null
}

// Admin → Dashboard → Members (api/admin.ts resource dashboard-members).
export type DashboardPeriod = '7' | '30' | '90' | '365' | 'all'

export interface AdminMemberDashboard {
  period: DashboardPeriod
  unit: 'day' | 'week' | 'month'
  // People who signed up in the period, and how far they got.
  funnel: {
    signedUp: number
    confirmed: number
    gotWorkspace: number
    startedTrial: number
    usedWorkspace: number
    bought: number
    trialToPaid: number
    freeClaimed: number
    granted: number
  }
  // Right now, all members (the team's own accounts not counted).
  snapshot: {
    members: number
    unconfirmed: number
    trialsActive: number
    trialsEndedNotBought: number
    activeGrants: number
    signedInLast7Days: number
  }
  series: { key: string; signedUp: number; confirmed: number }[]
  // Most used in the period: members who opened it or saved a record in it.
  topWorkspaces: { id: string; name: string; slug: string | null; members: number; records: number; newRecords: number }[]
  // Sign-up confirmation reminders sent in the period (day 1 / day 3), and
  // how many of those people confirmed afterwards. null = not counted yet
  // (Portal migration 0038 not run).
  reminders: { day1: number; day3: number; people: number; confirmedAfter: number } | null
}

// Admin → Deletions (api/admin.ts resource deletion-requests).
export interface AdminDeletionRequest {
  id: string
  user_id: string | null
  email: string | null // cleared once completed
  full_name: string | null
  reason: string | null
  source: 'website' | 'portal'
  status: 'pending' | 'cancelled' | 'completed' | 'rejected'
  admin_note: string | null
  decided_by: string | null
  requested_at: string
  decided_at: string | null
  // What would be deleted (pending requests only); null counts = unknown.
  data: {
    licenses: number | null
    grants: number | null
    records: number | null
    reviews: number | null
    conversations: number | null
    newsletter: string | null
  } | null
}

// Admin → Catalog → Searches (api/admin.ts resource site-searches): what
// visitors type in our catalog search. Counted since Sprint 97; only daily
// totals per term, nothing about who searched.
export interface AdminSiteSearchTerm {
  query: string
  count: number
}

export interface AdminSiteSearches {
  // false until the database update (Portal migration 0052) has run.
  ready: boolean
  days: number
  searches: number
  found: AdminSiteSearchTerm[]
  // What visitors wanted and we didn't have.
  empty: AdminSiteSearchTerm[]
  perDay: { day: string; count: number }[]
}

// Admin → Catalog (api/admin.ts resource catalog-health).
export interface AdminCatalogIssue {
  level: 'problem' | 'warning'
  text: string
}

export interface AdminCatalogWorkspace {
  id: string
  name: string
  slug: string
  lastPublishedAt: string | null
  steps: number
  issues: AdminCatalogIssue[]
  usage: { purchases: number; trials: number; records: number; reviews: number; rating: number | null }
}

export interface AdminCatalogHealth {
  workspaces: AdminCatalogWorkspace[]
  orphans: string[]
  system: {
    settings: { name: string; ok: boolean; optional?: boolean }[]
    updates: { name: string; ok: boolean }[]
    newsletterAddress: boolean
    activity: { name: string; at: string | null }[]
  }
}

// Admin → Bundles (Portal migration 0041).
export interface AdminBundle {
  id: string
  slug: string
  name: string
  short_description: string
  long_description: string
  cover_image_url: string | null
  category_id: string | null
  is_free: boolean
  price_cents: number | null
  currency: string
  status: 'draft' | 'published'
  last_published_at: string | null
  created_at: string
  // The included Workspaces' product ids, in order.
  item_ids: string[]
}

export interface AdminBundleWorkspace {
  id: string
  slug: string
  name: string
  cover_image_url: string | null
  is_free: boolean
  price_cents: number | null
  status: string
}

export interface AdminBundlesOverview {
  bundles: AdminBundle[]
  workspaces: AdminBundleWorkspace[]
  categories: AdminCategory[]
}

export interface AdminBundleDraft {
  id?: string
  name: string
  shortDescription: string
  longDescription: string
  isFree: boolean
  priceCents: number | null
  categoryId: string | null
  coverImageUrl: string | null
  status: 'draft' | 'published'
  itemIds: string[]
}

// Admin → Team (Portal migration 0042).
export interface AdminTeamMember {
  user_id: string
  email: string
  role: 'admin' | 'support'
  created_at: string
}

// Admin → Activity: one change made in the Admin area.
export type AdminActivityArea = 'members' | 'support' | 'catalog' | 'pages' | 'site' | 'newsletter' | 'deletions' | 'reviews' | 'team' | 'plans'

export interface AdminActivityEntry {
  id: string
  created_at: string
  admin_id: string | null
  admin_email: string
  action: string
  area: AdminActivityArea
  summary: string
  target_user_id: string | null
  target_user_email: string | null
  target_product_id: string | null
  target_product_name: string | null
}

export interface AdminActivityPage {
  entries: AdminActivityEntry[]
  total: number
  page: number
  pageSize: number
  admins: { id: string; email: string }[]
  // false until the database update (migration 0042) runs.
  ready: boolean
}

// Admin → Pages: members' public pages (Portal migration 0044).
export interface AdminMemberPagesOverview {
  pages: MemberPage[]
  // false until the database update (migration 0044) runs.
  ready: boolean
  // Pages released before launch (open while the site is closed).
  openPageIds?: string[]
  // Admin → Site "Subscribers build their own page". Off = a page handed to
  // its owner opens read-only for them.
  selfService?: boolean
}

// The team's page editor sends the shared draft plus the owner.
export interface AdminMemberPageDraft extends MemberPageDraft {
  // The BGrowth account that owns the page (sees its numbers in My Page);
  // empty = no owner.
  ownerEmail: string
  // The owner edits the page themselves in My Business Page (needs a plan
  // with a page — otherwise it stays off the site). Sprint 133.
  ownerManaged?: boolean
  // The team switched the e-mail list on for this page (Sprint 139).
  signupGranted?: boolean
  insightsGranted?: boolean
}

// Admin → Site (Portal migration 0046).
export interface AdminSiteProduct {
  id: string
  name: string
  slug: string
  content_type: string
}

export interface AdminSiteOverview {
  announcements: import('../site/types').SiteAnnouncement[]
  featured: string[]
  products: AdminSiteProduct[]
  ready: boolean
  /** false = visitors see "Coming soon"; only the team sees the site. */
  open: boolean
  /** Subscribers may build/publish their own page (off before launch). */
  selfService?: boolean
}

export interface AdminAnnouncementDraft {
  id?: string
  title: string
  body: string
  linkUrl: string
  linkLabel: string
  tone: import('../site/types').AnnouncementTone
  showBanner: boolean
  showBell: boolean
  active: boolean
  startsAt: string | null
  endsAt: string | null
}

// Admin → Catalog → Tags (Portal migration 0048).
export interface AdminTag {
  id: string
  name: string
  slug: string
  source: 'admin' | 'studio' | 'wix' | string
  created_at: string
}

export interface AdminTagsOverview {
  tags: AdminTag[]
  links: { product_id: string; tag_id: string }[]
  products: { id: string; name: string; slug: string; content_type: string; status: string }[]
  ready: boolean
}

// Admin → Plans (Portal migration 0057): a plan as stored, plus how many
// members have it right now (paid subscriptions and plans given by the team).
export interface AdminPlan extends StoredPlan {
  members: { paid: number; given: number }
}

// What the plan editor sends (prices in dollars; null = no price).
export interface AdminPlanDraft {
  id?: string
  slug?: string
  name: string
  description: string
  rank: number
  status: AdminPlan['status']
  isFree: boolean
  priceOnRequest: boolean
  monthly: number | null
  yearly: number | null
  monthlySale: number | null
  yearlySale: number | null
  features: string[]
  highlighted: boolean
  entitlements: import('../commerce/types/membership').PlanEntitlements
}

export interface AdminPlansOverview {
  ready: boolean
  plans: AdminPlan[]
  settings: import('../commerce/types/membership').PlanSettings
}

export type MemberPlanReason = 'promotion' | 'giveaway' | 'referral' | 'support' | 'other'

// One row of a member's plans (paid or given by the team).
export interface AdminMemberPlan {
  id: string
  plan_id: string
  source: 'subscription' | 'team'
  reason: MemberPlanReason | null
  note: string | null
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'ended'
  billing_interval: 'month' | 'year' | null
  provider: string | null
  starts_at: string
  ends_at: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  live: boolean
  membership_plans: { name: string; slug: string; rank: number } | null
}

export interface AdminMemberPlans {
  ready: boolean
  entries: AdminMemberPlan[]
  plans: { id: string; name: string; slug: string; rank: number; status: AdminPlan['status']; is_free: boolean }[]
  current: string
}

// Admin → Plans → Subscribers (Sprint 122).
export interface AdminPlanSubscriber {
  id: string
  user_id: string
  email: string | null
  name: string | null
  plan_name: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'ended'
  billing_interval: 'month' | 'year' | null
  starts_at: string
  ends_at: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  amount_cents: number | null
  canceled_at: string | null
  live: boolean
}

export interface AdminPlanSubscribers {
  ready: boolean
  subscribers: AdminPlanSubscriber[]
  stats: { paying: number; mrrCents: number; cancelling: number; pastDue: number; canceled30: number; given: number } | null
}

// Admin → Coupons (Sprint 123): discount codes kept in Stripe.
export interface AdminCoupon {
  id: string
  code: string
  name: string | null
  active: boolean
  createdAt: string
  expiresAt: string | null
  maxRedemptions: number | null
  timesRedeemed: number
  firstTimeOnly: boolean
  percentOff: number | null
  amountOffCents: number | null
  duration: 'once' | 'repeating' | 'forever'
  durationInMonths: number | null
  // Plan/product names it's limited to; null = everything.
  appliesTo: string[] | null
}

export interface AdminCouponsOverview {
  coupons: AdminCoupon[]
  plans: { id: string; name: string; product: string | null }[]
  // Workspaces, calculators, downloads and bundles a coupon can be limited to.
  items: { id: string; name: string; kind: string }[]
}

export interface AdminCouponDraft {
  code: string
  name: string
  kind: 'percent' | 'amount'
  value: number
  duration: 'once' | 'repeating' | 'forever'
  months: number | null
  planIds: string[]
  productIds: string[]
  maxRedemptions: number | null
  expiresAt: string | null
  firstTimeOnly: boolean
}

// Admin → Plans → Included (Sprint 126, Portal migration 0061).
export interface AdminPlanProducts {
  ready: boolean
  products: { id: string; name: string; slug: string; content_type: string; is_free: boolean; status: string }[]
  plans: { id: string; name: string; rank: number; status: string; includesAll: boolean }[]
  // product id → the lowest plan that includes it
  included: Record<string, string>
}
