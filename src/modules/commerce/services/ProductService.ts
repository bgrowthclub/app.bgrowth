import type { Product, ProductType, ProductStatus, ProductIndexEntry } from '../types/product'
import type { GrowthCategoryId } from '../../../types/growth'
import type { ProductRepository } from './ProductRepository'
import { createLocalProductRepository } from '../mock/mockProducts'

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
// repository passed into createProductService does.
export function createProductService(repository: ProductRepository): ProductService {
  async function loadFullProducts(entries: ProductIndexEntry[]): Promise<Product[]> {
    const products = await Promise.all(entries.map((entry) => repository.loadProduct(entry.id)))
    return products.filter((p): p is Product => Boolean(p))
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

    async listProducts(filter) {
      const index = await repository.loadIndex()
      const matches = index.products.filter((entry) => matchesFilter(entry, filter))
      return loadFullProducts(matches)
    },

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
  }
}

// Ready-to-use singleton for anything that just needs "the" ProductService
// today. Not imported by any page or component yet — see CLAUDE.md's
// Commerce rules on not using mock data as a stand-in for the real catalog
// (data/systems.ts stays authoritative for actual Business Systems) until
// this is genuinely backed by Studio-published data.
export const productService: ProductService = createProductService(createLocalProductRepository())
