// The minimal reference needed to hand off from a purchase entry point
// (PricingCard, PurchaseCard) to the Checkout page across a client-side
// navigation — a navigation-layer concern, not a commerce domain type.
// Deliberately just a productId + workspaceId, not a data snapshot: every
// page that needs product details (price, title, images, ...) loads the
// live Product through ProductService itself, so nothing here can ever go
// stale or duplicate what Commerce already owns (see the Runtime↔Product
// Engine connection milestone, and lib/checkout.ts's buildCheckoutSelection).
export interface CheckoutSelection {
  productId: string
  // WorkspaceCategory.slug (src/data/workspaceCategories.ts) — the
  // Workspace™ ecosystem category this product belongs to.
  workspaceId: string
}
