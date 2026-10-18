import type { ProductBenefit, ProductType, ProductStatus } from './product'
import type { CurrencyCode } from './pricing'

// BGrowth's subscription tiers (decided 27/09/2026): Free → Starter → Pro →
// Enterprise. Academies are sold separately (with member discounts), so a
// tier never replaces a premium purchase. A new tier is a new id here plus
// a new entry in data/membershipPlans.ts — never a second plan shape.
export type MembershipTierId = 'free' | 'starter' | 'pro' | 'enterprise'

// What a tier costs. `price` is the regular price; `salePrice`, when set,
// is a promotion and is what the member actually pays (the regular price
// is shown struck through). Until the Administration area exists, these
// values are edited in data/membershipPlans.ts.
export interface MembershipPricing {
  price: number
  salePrice?: number
  currency: CurrencyCode
  interval: 'month' | 'year'
}

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

// A reusable membership tier definition.
export interface MembershipPlan {
  id: string
  tier: MembershipTierId
  name: string
  description: string
  // Absent = no public price (e.g. Enterprise: "talk to us").
  pricing?: MembershipPricing
  features: string[]
  benefits: ProductBenefit[]
  discounts: MembershipDiscount[]
  rewardMultiplier: number // e.g. 1 = normal earn rate, 1.5 = +50%
  permissions: MembershipPermissions
  status: ProductStatus
}

// What a plan unlocks (Portal migration 0057, Sprint 121) — set per plan in
// Admin → Plans and kept in portal.membership_plans.entitlements. Only what
// is set is present; nothing = nothing extra. A new kind of benefit is a new
// optional field here (plus its cleaning in api/admin.ts cleanEntitlements).
export interface PlanEntitlements {
  // The member's own page (/p/…): part of it editable, or all of it.
  memberPage?: 'partial' | 'full'
  prioritySupport?: boolean
  // Off the price of Workspaces bought one by one.
  workspaceDiscountPercent?: number
  // Off Academy courses (applies once the Academy exists): every course or
  // only the ones named.
  academyDiscount?: { percent: number; scope: 'all' | 'selected'; courses: string[] }
}

// How subscriptions behave (portal.site_settings key 'plans').
export interface PlanSettings {
  provider: 'stripe'
  cancelAt: 'period_end' | 'now'
  graceDays: number
  allowSwitch: boolean
  yearlyDiscountPercent: number
}
