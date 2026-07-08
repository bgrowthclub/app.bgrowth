import type { ProductBenefit, ProductType, ProductStatus } from './product'

// The six membership tiers BGrowth supports today, per PRODUCT_CATALOG.md's
// ecosystem shape. Deliberately no pricing here yet — see MembershipPlan.
export type MembershipTierId = 'free' | 'club' | 'workspace' | 'creator' | 'business' | 'enterprise'

export interface MembershipPermissions {
  workspaceAccess: boolean
  marketplaceAccess: boolean
  academyAccess: boolean
  communityAccess: boolean
  aiAccess: boolean
  // Escape hatch for a permission this interface doesn't model yet (e.g. a
  // future Enterprise-only capability) — extend the interface properly
  // once the shape is known, don't read this ad hoc in the meantime.
  futurePermissions?: Record<string, boolean>
}

export interface MembershipDiscount {
  label: string
  percentOff: number // 0-100
  appliesTo: ProductType[] | 'all'
}

// A reusable membership tier definition. Intentionally has no price field —
// Milestone 5.1 is architecture only; pricing a tier is a future, separate
// decision layered on top of this shape.
export interface MembershipPlan {
  id: string
  tier: MembershipTierId
  name: string
  description: string
  features: string[]
  benefits: ProductBenefit[]
  discounts: MembershipDiscount[]
  rewardMultiplier: number // e.g. 1 = normal earn rate, 1.5 = +50%
  permissions: MembershipPermissions
  status: ProductStatus
}
