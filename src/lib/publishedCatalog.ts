import { productService } from '../modules/commerce/services/ProductService'
import { getSystemBySlug } from '../data/systems'
import { getMemberPrice } from './checkout'
import type { Product } from '../modules/commerce/types/product'
import type { BusinessSystem } from '../types/system'

// Resolves a product's underlying BusinessSystem when it's GrowthSystem-
// sourced — the one place every marketing-site page bridges Commerce's
// Product (what's sold: pricing, SEO, images, marketing copy — see
// modules/commerce/types/product.ts) back to the Runtime's BusinessSystem
// (what a GrowthSystem-type product actually contains: modules, resources,
// reviews, whoIsFor). A product with no GrowthSystem source (a Course, a
// Membership, ...) simply resolves to undefined here; callers render
// whatever Product-only content applies and skip the rest, never fork a
// second Runtime pipeline for it (see CLAUDE.md §4, §9).
export function resolveProductSystem(product: Product): BusinessSystem | undefined {
  return product.source?.type === 'GrowthSystem' ? getSystemBySlug(product.source.id) : undefined
}

// A GrowthSystem-backed product paired with its real BusinessSystem — the
// shape every browse/catalog surface needs to keep rendering through the
// existing BusinessSystem-typed cards (BusinessSystemCard, WorkspaceCoverCard)
// without forking them into Product-aware siblings, per the Component
// Evolution Rule (CLAUDE.md §6). Products with no GrowthSystem source are
// filtered out here since those cards have nothing to render for them yet.
export interface PublishedSystemProduct {
  product: Product
  system: BusinessSystem
}

export function pairProductsWithSystems(products: Product[]): PublishedSystemProduct[] {
  return products
    .map((product) => {
      const system = resolveProductSystem(product)
      return system ? { product, system } : undefined
    })
    .filter((p): p is PublishedSystemProduct => Boolean(p))
}

// BusinessSystemCard/WorkspaceCoverCard read title/shortDescription/price/
// slug straight off the `system` object they're given — without this, a
// Studio-edited Product title, description, or price would never actually
// reach the homepage or catalog card, only the underlying Workspace's own
// unrelated values would (and two Products wrapping the same Workspace
// would collapse into one card, since both would resolve to the same
// system.slug). Overriding those specific fields — never modifying the
// cards themselves — keeps every other BusinessSystem field (modules,
// resources, reviews, whoIsFor) exactly as Studio's Content Source tab
// left it, since Product doesn't model those.
export function systemForCard(pair: PublishedSystemProduct): BusinessSystem {
  const { product, system } = pair
  return {
    ...system,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    shortDescription: product.description,
    difficulty: product.difficulty ?? system.difficulty,
    estimatedTime: product.estimatedTime ?? system.estimatedTime,
    price: product.price,
    memberPrice: getMemberPrice(product),
  }
}

// The Homepage's featured row — see ProductService.getFeatured().
export async function loadFeaturedSystemProducts(): Promise<PublishedSystemProduct[]> {
  return pairProductsWithSystems(await productService.getFeatured())
}

// The Workspace Catalog — see ProductService.getPublished().
export async function loadPublishedSystemProducts(): Promise<PublishedSystemProduct[]> {
  return pairProductsWithSystems(await productService.getPublished())
}
