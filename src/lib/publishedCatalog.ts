import { productCatalogService } from '../modules/commerce/services/ProductCatalogService'
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

// The Homepage's featured row — see ProductCatalogService.getFeatured().
export async function loadFeaturedSystemProducts(): Promise<PublishedSystemProduct[]> {
  return pairProductsWithSystems(await productCatalogService.getFeatured())
}

// The Workspace Catalog — see ProductCatalogService.getAll() (the Static
// Product Repository only ever contains published products, so "all" and
// "published" mean the same thing here — see data/products/staticProducts.ts).
export async function loadPublishedSystemProducts(): Promise<PublishedSystemProduct[]> {
  return pairProductsWithSystems(await productCatalogService.getAll())
}

// The Dashboard's "Recently Added" row — mirrors data/systems.ts's former
// getRecentlyAddedSystems() approach (catalog array order, reversed, stands
// in for a real createdAt/publishedAt-based sort — see
// data/products/staticProducts.ts, which has no reliable timestamp field
// populated yet either), but reads Products via ProductCatalogService
// instead of BusinessSystem directly, so price/featured/etc. never drift
// from the one catalog.
export async function loadRecentlyAddedSystemProducts(limit = 4): Promise<PublishedSystemProduct[]> {
  const all = await productCatalogService.getAll()
  return pairProductsWithSystems([...all].reverse().slice(0, limit))
}

// The Dashboard's "Recommended For You" row — mirrors data/systems.ts's
// former getRecommendedSystems() logic (related products of what's already
// owned, excluding anything owned, topped up with featured products if
// there aren't enough), but reads Products via ProductCatalogService
// instead of BusinessSystem.relatedSystems. Not a real recommendation
// engine. `ownedProductSlugs` is expected to come from AccessService (see
// lib/productLibrary.ts's useOwnedProducts), never from a hardcoded list.
export async function loadRecommendedSystemProducts(
  ownedProductSlugs: string[],
  limit = 4,
): Promise<PublishedSystemProduct[]> {
  const owned = new Set(ownedProductSlugs)

  const ownedProducts = await Promise.all(ownedProductSlugs.map((slug) => productCatalogService.getBySlug(slug)))
  const relatedLists = await Promise.all(
    ownedProducts
      .filter((p): p is Product => Boolean(p))
      .map((p) => productCatalogService.getRelatedProducts(p.id)),
  )
  const related = relatedLists.flat().filter((p) => !owned.has(p.slug))
  const deduped = Array.from(new Map(related.map((p) => [p.slug, p])).values())

  if (deduped.length < limit) {
    const seen = new Set(deduped.map((p) => p.slug))
    const featured = await productCatalogService.getFeatured()
    deduped.push(...featured.filter((p) => !owned.has(p.slug) && !seen.has(p.slug)))
  }

  return pairProductsWithSystems(deduped.slice(0, limit))
}
