import type { BusinessSystem } from '../types/system'
import type { CheckoutSelection } from '../types/checkout'

// Single place that turns a BusinessSystem into the CheckoutSelection
// handed to /checkout via router navigation state — every purchase entry
// point on the Product Page (PricingCard, PurchaseCard) builds its
// selection through this function so they always navigate with identical
// state, per CLAUDE.md's "never duplicate the read" spirit.
export function buildCheckoutSelection(system: BusinessSystem, workspaceId: string): CheckoutSelection {
  return {
    productId: system.id,
    productSlug: system.slug,
    productName: system.title,
    shortDescription: system.shortDescription,
    price: system.price,
    memberPrice: system.memberPrice,
    category: system.category,
    workspaceId,
  }
}

// Shared narrowing guard for router navigation `state` — used by both
// CheckoutPage and CheckoutSuccessPage so a direct/bookmarked visit with no
// (or malformed) state is handled identically on every step of the flow.
export function isCheckoutSelection(value: unknown): value is CheckoutSelection {
  return !!value && typeof value === 'object' && 'productId' in value && 'productSlug' in value
}
