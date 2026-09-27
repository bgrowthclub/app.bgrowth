import type { Product } from '../modules/commerce/types/product'
import type { CheckoutSelection } from '../types/checkout'

// Single place that builds the CheckoutSelection handed to /checkout via
// router navigation state — every purchase entry point on the Product Page
// (PricingCard, PurchaseCard) builds its selection through this function so
// they always navigate with identical state, per CLAUDE.md's "never
// duplicate the read" spirit. Deliberately just a reference (productId) —
// CheckoutPage loads the live Product itself through ProductService.
export function buildCheckoutSelection(product: Product, workspaceId: string): CheckoutSelection {
  return { productId: product.id, workspaceId }
}

// Shared narrowing guard for router navigation `state` — used by both
// CheckoutPage and CheckoutSuccessPage so a direct/bookmarked visit with no
// (or malformed) state is handled identically on every step of the flow.
export function isCheckoutSelection(value: unknown): value is CheckoutSelection {
  return !!value && typeof value === 'object' && 'productId' in value && 'workspaceId' in value
}

// A member's discounted price for a product — the one place
// `clubDiscountPercent` (set in Studio's Pricing tab) is turned into an
// actual number, so PricingCard, PurchaseCard, and CheckoutPage can never
// compute it three slightly different ways.
export function getMemberPrice(product: Product): number {
  const discount = product.clubDiscountPercent ?? 0
  return Math.max(0, product.basePrice * (1 - discount / 100))
}
