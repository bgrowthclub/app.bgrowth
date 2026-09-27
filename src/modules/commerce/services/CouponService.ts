import type { Coupon } from '../types/benefits'
import type { Cart } from '../types/purchase'

// Interface only — no implementation. The single Commerce Engine home for
// coupon-code mechanics, consolidating what was previously split across
// DiscountService.applyCoupon and BenefitService.redeemCoupon (both
// removed in favor of this service — see those files). Discount (a
// non-code price reduction, e.g. a membership-tier discount) stays owned
// by DiscountService; Coupon (a redeemable code) is owned here
// exclusively.
export interface CouponService {
  redeemCoupon(code: string): Promise<Coupon | undefined>
  applyCoupon(cart: Cart, couponCode: string): Promise<Cart>
  validateCoupon(code: string): Promise<boolean>
}
