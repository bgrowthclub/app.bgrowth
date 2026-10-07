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
