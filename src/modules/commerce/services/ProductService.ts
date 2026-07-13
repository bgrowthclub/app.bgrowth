import type { Product, ProductType, ProductStatus } from '../types/product'
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

// The one concrete ProductService implementation today — everything it
// does is an in-memory query over whatever its ProductRepository returns.
// Swapping createLocalProductRepository() for a future
// RemoteProductRepository (fetching Studio-published Product JSON from
// GitHub) is the only change needed to go from mock to real; this
// function's body, and every caller of the service it returns, stay the
// same.
export function createProductService(repository: ProductRepository): ProductService {
  return {
    async getProductById(id) {
      const products = await repository.loadAll()
      return products.find((p) => p.id === id)
    },

    async getProductBySlug(slug) {
      const products = await repository.loadAll()
      return products.find((p) => p.slug === slug)
    },

    async listProducts(filter) {
      const products = await repository.loadAll()
      return products.filter((p) => {
        if (filter?.category && p.category !== filter.category) return false
        if (filter?.type && p.type !== filter.type) return false
        if (filter?.status && p.status !== filter.status) return false
        if (filter?.featured !== undefined && p.featured !== filter.featured) return false
        return true
      })
    },

    async searchProducts(query) {
      const products = await repository.loadAll()
      const q = query.trim().toLowerCase()
      if (!q) return []
      // Matches data/systems.ts's searchSystems: published products only.
      return products.filter(
        (p) =>
          p.status === 'published' &&
          (p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((tag) => tag.toLowerCase().includes(q))),
      )
    },
  }
}

// Ready-to-use singleton for anything that just needs "the" ProductService
// today. Not imported by any page or component yet — see CLAUDE.md's
// Commerce rules on not using mock data as a stand-in for the real catalog
// (data/systems.ts stays authoritative for actual Business Systems) until
// this is genuinely backed by Studio-published data.
export const productService: ProductService = createProductService(createLocalProductRepository())
