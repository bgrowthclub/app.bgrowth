import type { Benefit } from '../types/benefits'

// Interface only — no implementation. Prepares for BGrowth Benefits™.
// Coupon redemption (redeemCoupon) moved out to CouponService — see that
// file — so all coupon-code mechanics live in one Commerce Engine
// service instead of being split across Benefits and Discounts.
export interface BenefitService {
  listBenefitsForMember(memberId: string): Promise<Benefit[]>
  getBenefitById(id: string): Promise<Benefit | undefined>
}
