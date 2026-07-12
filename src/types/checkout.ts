// The minimal snapshot of a purchase selection needed to render the
// Checkout page across a client-side navigation — a navigation-layer
// concern, not a commerce domain type. It intentionally does NOT duplicate
// Commerce's `Product`/`Purchase`/`Order` (src/modules/commerce/types/),
// which model the full provider-agnostic purchase domain (cart, currency,
// tax, purchase status, provider refs). This type exists purely so
// PricingCard can hand off to CheckoutPage via React Router navigation
// `state`, without CheckoutPage re-fetching the same data through
// `getSystemBySlug`. When BGrowth Commerce™ is actually wired up (see
// CLAUDE.md §16), this type is the natural seed for a
// `CheckoutSessionRequest`/`Cart`, not something to keep alongside it.
export interface CheckoutSelection {
  productId: string
  productSlug: string
  productName: string
  shortDescription: string
  price: number
  memberPrice: number
  // BusinessSystem.category (e.g. "Notary") — used to resolve a category
  // icon as the product visual, matching how BusinessSystemCard/ProductPage
  // already stand in for a missing thumbnail image.
  category: string
  // WorkspaceCategory.slug (src/data/workspaceCategories.ts) — the
  // Workspace™ ecosystem category this product belongs to.
  workspaceId: string
}
