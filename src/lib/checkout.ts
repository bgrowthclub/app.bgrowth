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
