import type { Discount } from '../types/benefits'
import type { MembershipTierId } from '../types/membership'
import type { Cart } from '../types/purchase'

// Interface only — no implementation.
export interface DiscountService {
  getDiscountForMembership(tier: MembershipTierId, productId: string): Promise<Discount | undefined>
  applyCoupon(cart: Cart, couponCode: string): Promise<Cart>
  listActiveDiscounts(productId: string): Promise<Discount[]>
}
