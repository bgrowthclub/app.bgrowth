import type { Product, ProductType, ProductStatus, ProductIndexEntry } from '../types/product'
import type { GrowthCategoryId } from '../../../types/growth'
import type { ProductRepository } from './ProductRepository'
import { createPublishedProductRepository } from '../store/publishedProductRepository'

export interface ProductListFilter {
  category?: GrowthCategoryId
  type?: ProductType
  status?: ProductStatus
  featured?: boolean
}

// The rest of the app is expected to depend on this instead of reading
// Product data directly (see mock/mockProducts.ts, ProductRepository.ts).
// Read-only, deliberately: app.bgrowth is the Runtime, not Studio — this
// interface has no save/publish/archive method.
export interface ProductService {
  getProductById(id: string): Promise<Product | undefined>
  getProductBySlug(slug: string): Promise<Product | undefined>
  listProducts(filter?: ProductListFilter): Promise<Product[]>
  searchProducts(query: string): Promise<Product[]>
  // Every product currently live — the Homepage's featured row, per the
  // Runtime↔Product Engine connection milestone.
  getFeatured(): Promise<Product[]>
  // Every published product, unfiltered — the Workspace Catalog reads
  // through this. Functionally identical to `listProducts()` with no
  // filter today (the repository is published-only by construction — see
  // store/publishedProductRepository.ts) but named to match what callers
  // actually mean at the call site.
  getPublished(): Promise<Product[]>
  // Resolves a product's `relatedProductIds` (set in Studio's Website tab)
  // into full Product records. Never a hardcoded relationship — an empty
  // `relatedProductIds` simply resolves to an empty list.
  getRelated(productId: string): Promise<Product[]>
}

function matchesFilter(entry: ProductIndexEntry, filter?: ProductListFilter): boolean {
  if (filter?.category && entry.category !== filter.category) return false
  if (filter?.type && entry.type !== filter.type) return false
  if (filter?.status && entry.status !== filter.status) return false
  if (filter?.featured !== undefined && entry.featured !== filter.featured) return false
  return true
}

// The one concrete ProductService implementation today — every method
// loads the repository's lightweight index first, decides what it actually
// needs from it, and only then loads full product bodies for the entries
// that matched. This is what makes "request only the Product JSON files it
// needs" true automatically once the repository is backed by a real Remote
// Product Source — nothing here changes when that happens; only the
// repository passed into createProductService does. There is also no
// caching anywhere in this chain — every call reads the repository fresh —
// so a Studio publish is visible to the very next ProductService call with
// nothing to explicitly "refresh".
export function createProductService(repository: ProductRepository): ProductService {
  async function loadFullProducts(entries: ProductIndexEntry[]): Promise<Product[]> {
    const products = await Promise.all(entries.map((entry) => repository.loadProduct(entry.id)))
    return products.filter((p): p is Product => Boolean(p))
  }

  async function listProducts(filter?: ProductListFilter): Promise<Product[]> {
    const index = await repository.loadIndex()
    const matches = index.products.filter((entry) => matchesFilter(entry, filter))
    return loadFullProducts(matches)
  }

  return {
    async getProductById(id) {
      return repository.loadProduct(id)
    },

    async getProductBySlug(slug) {
      const index = await repository.loadIndex()
      const entry = index.products.find((p) => p.slug === slug)
      return entry ? repository.loadProduct(entry.id) : undefined
    },

    listProducts,

    async searchProducts(query) {
      const index = await repository.loadIndex()
      const q = query.trim().toLowerCase()
      if (!q) return []
      // Matches data/systems.ts's searchSystems: published products only.
      const matches = index.products.filter(
        (entry) =>
          entry.status === 'published' &&
          (entry.title.toLowerCase().includes(q) ||
            entry.description.toLowerCase().includes(q) ||
            entry.tags.some((tag) => tag.toLowerCase().includes(q))),
      )
      return loadFullProducts(matches)
    },

    async getFeatured() {
      return listProducts({ featured: true })
    },

    async getPublished() {
      return listProducts()
    },

    async getRelated(productId) {
      const product = await repository.loadProduct(productId)
      const ids = product?.relatedProductIds ?? []
      if (ids.length === 0) return []
      const related = await Promise.all(ids.map((id) => repository.loadProduct(id)))
      return related.filter((p): p is Product => Boolean(p))
    },
  }
}

// Ready-to-use singleton every page/component reads through — backed by
// the Published Product Repository (see store/publishedProductRepository.ts),
// so this is genuinely "every product Studio has published," not mock data
// standing in for the real catalog.
export const productService: ProductService = createProductService(createPublishedProductRepository())
