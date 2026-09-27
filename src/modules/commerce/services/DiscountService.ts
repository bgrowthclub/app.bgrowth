import type { Discount } from '../types/benefits'
import type { MembershipTierId } from '../types/membership'

// Interface only — no implementation. Coupon-code mechanics (applyCoupon)
// moved out to CouponService — see that file — so this service owns only
// non-code Discounts (membership-tier and per-product price reductions).
export interface DiscountService {
  getDiscountForMembership(tier: MembershipTierId, productId: string): Promise<Discount | undefined>
  listActiveDiscounts(productId: string): Promise<Discount[]>
}
