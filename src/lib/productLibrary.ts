import { useEffect, useState } from 'react'
import type { User } from '../modules/identity/types/user'
import type { Purchase } from '../modules/commerce/types/purchase'
import type { ProductAccess } from '../modules/commerce/types/access'
import type { Product, ProductType } from '../modules/commerce/types/product'
import type { ProductAccessState, ProductLibraryStatus, UserProduct } from '../types/productLibrary'
import { ICONS_BY_CATEGORY } from '../components/systems/categoryIcons'
import { resolveProductSystem } from './publishedCatalog'
import { accessService } from '../modules/commerce/services/AccessService'
import { productService } from '../modules/commerce/services/ProductService'

// Turns a Product this member has access to into a UserProduct — works for
// any ProductType, not only GrowthSystem: icon/subTag get a real BusinessSystem
// category when the product is GrowthSystem-sourced (resolved read-only via
// `source`, same adapter every marketing page uses — see
// lib/publishedCatalog.ts), and fall back to the category icon/no subTag
// otherwise, since Product itself doesn't model that narrower taxonomy.
function buildUserProduct(product: Product, access: ProductAccess, user: User): UserProduct {
  const system = resolveProductSystem(product)
  const purchase: Purchase = {
    id: `purchase-${product.id}`,
    productId: product.id,
    memberId: user.id,
    type: 'one-time',
    status: 'completed',
    quantity: 1,
    createdAt: access.grantedAt,
  }

  return {
    productId: product.id,
    type: product.type,
    slug: product.slug,
    title: product.title,
    description: product.description,
    icon: ICONS_BY_CATEGORY[system?.category ?? ''] ?? ICONS_BY_CATEGORY.Default,
    tag: product.industry ?? product.category,
    subTag: system?.category,
    difficulty: product.difficulty,
    estimatedTime: product.estimatedTime,
    purchase,
    access,
    // No real "last opened" signal exists on ProductAccess yet (today's
    // access is mock — see modules/commerce/mock/mockProductAccess.ts);
    // ProductLibraryCard already renders "Not opened yet" when this is
    // undefined, and sort falls back to the purchase date.
    lastOpenedAt: undefined,
    progress: user.progress.find((p) => p.productId === product.slug),
  }
}

// The Product Library's data accessor — every "what does this member own"
// surface (My Workspaces today; My Products, once other product types
// exist) reads through AccessService + ProductService, never through mock
// data directly. Today AccessService is backed by mock access grants (see
// modules/commerce/mock/mockProductAccess.ts); a real purchase completing
// would call AccessService.grantAccess() instead, and nothing here changes.
export async function getUserProducts(user: User): Promise<UserProduct[]> {
  const grants = await accessService.listAccessForMember(user.id)
  const products = await Promise.all(
    grants
      .filter((g) => g.hasAccess)
      .map(async (access) => {
        const product = await productService.getProductById(access.productId)
        return product ? buildUserProduct(product, access, user) : undefined
      }),
  )
  return products.filter((p): p is UserProduct => Boolean(p))
}

// Shared loading state for every surface that renders a member's owned
// products (MyBusinessSystemsPage, MyBusinessSystemsSection,
// ContinueBuildingSection) — avoids repeating the same effect/state
// boilerplate three times for what is otherwise a one-line data need.
export function useOwnedProducts(user: User | null | undefined): UserProduct[] {
  const [owned, setOwned] = useState<UserProduct[]>([])

  useEffect(() => {
    if (!user) {
      setOwned([])
      return
    }
    let cancelled = false
    getUserProducts(user).then((products) => {
      if (!cancelled) setOwned(products)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  return owned
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
