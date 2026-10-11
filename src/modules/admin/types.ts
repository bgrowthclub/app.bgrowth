import type { MemberPage, MemberPageHighlight, MemberPageLink, MemberPageService } from '../find/types'
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
export type AdminActivityArea = 'members' | 'support' | 'catalog' | 'pages' | 'newsletter' | 'deletions' | 'reviews' | 'team'

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
}

export interface AdminMemberPageDraft {
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
  // The BGrowth account that owns the page (sees its numbers in My Page);
  // empty = no owner.
  ownerEmail: string
}
