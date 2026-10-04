import type { PortalAccessGrantRow, PortalLicenseRow } from '../workspace/types/portal'
import type { SupportConversationSummary, SupportHours, SupportMessage } from '../support/types'

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
