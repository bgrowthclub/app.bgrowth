import type { BusinessSystem } from '../types/system'
import type { User, UserProgress } from '../modules/identity/types/user'
import type { Purchase } from '../modules/commerce/types/purchase'
import type { ProductAccess } from '../modules/commerce/types/access'
import type { ProductType } from '../modules/commerce/types/product'
import type { ProductAccessState, ProductLibraryStatus, UserProduct } from '../types/productLibrary'
import { ICONS_BY_CATEGORY } from '../components/systems/categoryIcons'
import { getSystemBySlug } from '../data/systems'
import { MOCK_PURCHASES } from '../data/memberMock'

// Turns a BusinessSystem into a UserProduct with type: 'GrowthSystem' — the
// only ProductType this app actually populates today. A future product
// (Course, Membership, standalone Planner™/Calculator™, ...) would get its
// own small builder alongside this one, each producing the same UserProduct
// shape from whatever its own source content is — none of them touching
// ProductLibraryCard or this file's accessors below.
function buildGrowthSystemUserProduct(
  system: BusinessSystem,
  purchasedOn: string,
  lastOpenedAt: string | undefined,
  memberId: string,
  progress: UserProgress | undefined,
): UserProduct {
  const purchase: Purchase = {
    id: `purchase-${system.slug}`,
    productId: system.slug,
    memberId,
    type: 'one-time',
    status: 'completed',
    quantity: 1,
    createdAt: purchasedOn,
  }
  const access: ProductAccess = {
    productId: system.slug,
    memberId,
    hasAccess: true,
    source: 'purchase',
    grantedAt: purchasedOn,
  }

  return {
    productId: system.slug,
    type: 'GrowthSystem',
    slug: system.slug,
    title: system.title,
    description: system.shortDescription,
    icon: ICONS_BY_CATEGORY[system.category] ?? ICONS_BY_CATEGORY.Default,
    tag: system.industry,
    subTag: system.category,
    difficulty: system.difficulty,
    estimatedTime: system.estimatedTime,
    purchase,
    access,
    lastOpenedAt,
    progress,
  }
}

// The Product Library's data accessor — every "what does this member own"
// surface (My Workspaces today; My Products, once other product types
// exist) reads through this, never through data/memberMock.ts directly.
// This is the one function standing in for the target architecture's
// "Purchase Database" step — once a real PurchaseService/ProductAccess
// lookup exists across every product type, only this function's body
// changes.
export function getUserProducts(user: User): UserProduct[] {
  return MOCK_PURCHASES.map((record) => {
    const system = getSystemBySlug(record.slug)
    if (!system) return undefined
    const progress = user.progress.find((p) => p.productId === system.slug)
    return buildGrowthSystemUserProduct(system, record.purchasedOn, record.lastOpenedAt, user.id, progress)
  }).filter((p): p is UserProduct => Boolean(p))
}

// Derives the card's "Status" from BGrowth Identity™'s own UserProgress —
// no separate mock status field, so there is exactly one place progress
// can drift from what a member actually sees.
export function getProductLibraryStatus(product: UserProduct): ProductLibraryStatus {
  const percent = product.progress?.percentComplete ?? 0
  if (percent >= 100) return 'completed'
  if (percent > 0) return 'in-progress'
  return 'not-started'
}

// Every Workspace/product resolves to one of two access states, purely
// from whether its slug is in the member's owned list. Reusable anywhere a
// product needs to decide between "Open Workspace" and "Buy Workspace";
// not wired into the public catalog yet (out of this milestone's scope),
// but ready for it — a future ProductAccess lookup would replace
// `ownedSlugs.includes(...)` without changing this function's signature or
// any caller.
export function getProductAccessState(productSlug: string, ownedSlugs: string[]): ProductAccessState {
  return ownedSlugs.includes(productSlug) ? 'purchased' : 'not-purchased'
}

// The single place a product's primary Library action is decided — no
// card, section, or page should ever hardcode "Open Workspace" (or any
// other label) itself. Add a case here when a new ProductType actually
// ships; everything downstream (ProductLibraryCard, any future surface)
// picks it up automatically.
const PRODUCT_ACTION_LABEL: Partial<Record<ProductType, string>> = {
  GrowthSystem: 'Open Workspace',
  Course: 'Continue Learning',
  Planner: 'Open Planner',
  Calculator: 'Open Calculator',
  Membership: 'Manage Membership',
  AIAssistant: 'Open AI Assistant',
}

export function getProductActionLabel(type: ProductType): string {
  return PRODUCT_ACTION_LABEL[type] ?? 'Open'
}

// The single place a product's primary Library action routes to. Only
// GrowthSystem (today's only real product type) and Membership (an
// already-real route) resolve anywhere meaningful — every other ProductType
// falls back to the product's detail page until its own destination is
// built, matching how Continue to Payment/Continue to Secure Checkout were
// left as prepared-but-unwired TODOs earlier in this purchase flow.
export function getProductActionRoute(product: UserProduct): string {
  switch (product.type) {
    case 'GrowthSystem':
      return `/system/${product.slug}`
    case 'Membership':
      return '/platform/membership'
    default:
      return `/product/${product.slug}`
  }
}
