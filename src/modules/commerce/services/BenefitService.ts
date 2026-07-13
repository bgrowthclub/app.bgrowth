import type { Benefit, Coupon } from '../types/benefits'

// Interface only — no implementation. Prepares for BGrowth Benefits™.
export interface BenefitService {
  listBenefitsForMember(memberId: string): Promise<Benefit[]>
  getBenefitById(id: string): Promise<Benefit | undefined>
  redeemCoupon(code: string): Promise<Coupon | undefined>
}
