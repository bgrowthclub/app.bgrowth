import type { MembershipTierId } from './membership'

// How a member came to have access to a product — deliberately separate
// from *how they paid* (that's Purchase/Transaction). A member can have
// access without a direct Purchase record at all (membership, bundle,
// reward unlock, gift, trial, or a future enterprise seat).
export type AccessSource =
  | 'purchase'
  | 'membership'
  | 'bundle'
  | 'reward-unlock'
  | 'gift'
  | 'trial'
  | 'enterprise-seat'

// The single source of truth Workspace should eventually check before
// rendering a Growth System (or any product) as "owned" — see
// ARCHITECTURE.md: Commerce determines access independently of whichever
// payment provider was involved, and independently of Workspace's own
// mock ownership data (data/memberMock.ts) today.
export interface ProductAccess {
  productId: string
  memberId: string
  hasAccess: boolean
  source: AccessSource
  grantedAt: string
  expiresAt?: string // set for temporary/trial access; omitted = permanent
}

// A member's full access picture — every product they can reach, plus
// their current membership tier if any.
export interface UserEntitlement {
  memberId: string
  productAccess: ProductAccess[]
  membershipTier?: MembershipTierId
  membershipExpiresAt?: string
}

// Seat-based access for team/enterprise use — not exercised by any current
// product, reserved for the future Enterprise membership tier.
export interface License {
  id: string
  productId: string
  memberId: string
  seats: number
  seatsUsed: number
  issuedAt: string
  expiresAt?: string
}
