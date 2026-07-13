import type { ProductType } from './product'
import type { MembershipTierId } from './membership'

export type BenefitType =
  | 'partner-discount'
  | 'coupon'
  | 'exclusive-offer'
  | 'software-discount'
  | 'member-benefit'

export interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  appliesTo: ProductType[] | 'all'
  maxRedemptions?: number
  expiresAt?: string
}

export interface Discount {
  id: string
  label: string
  type: 'percent' | 'fixed'
  value: number
  productId?: string
  membershipTier?: MembershipTierId
}

// A member-facing BGrowth Benefits™ entry — the thing a member actually
// sees and redeems, as opposed to Coupon/Discount which are the mechanics
// underneath it.
export interface Benefit {
  id: string
  type: BenefitType
  title: string
  description: string
  partnerId?: string // AffiliatePartner id, see partners.ts
  requiredMembershipTier?: MembershipTierId
  code?: string
  expiresAt?: string
}
