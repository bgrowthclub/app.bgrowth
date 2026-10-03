import type { PortalAccessGrantRow, PortalLicenseRow } from '../workspace/types/portal'

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
