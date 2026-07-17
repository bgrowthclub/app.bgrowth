import type { Product } from '../types/product'
import type { ProductIndexEntry } from '../types/product'
import type { GrowthCategoryId } from '../../../types/growth'
import type { ProductRepository } from './ProductRepository'
import { createStaticProductRepository } from '../store/staticProductRepository'

// The Website's single entry point for reading products — every
// marketing-site page and component is expected to depend on this instead
// of a repository, mock data, or Studio's own admin service directly (see
// data/products/staticProducts.ts and store/staticProductRepository.ts).
// Deliberately the same index-first shape as the existing ProductService
// (services/ProductService.ts, still used by Member Area ownership — see
// lib/productLibrary.ts) rather than a redesign of it: this is a distinct
// public surface for the Website's catalog, not a competing architecture.
//
// Future migration path:
//   Website -> ProductCatalogService -> StaticProductRepository -> Product
//   Website -> ProductCatalogService -> ProductEngineRepository -> Database
// Only the repository passed into createProductCatalogService changes;
// no page or component reading through this service needs to change.
export interface ProductCatalogService {
  getAll(): Promise<Product[]>
  getById(id: string): Promise<Product | undefined>
  getBySlug(slug: string): Promise<Product | undefined>
  getFeatured(): Promise<Product[]>
  getByCategory(category: GrowthCategoryId): Promise<Product[]>
  getByIndustry(industry: string): Promise<Product[]>
  getRelatedProducts(productId: string): Promise<Product[]>
  search(query: string): Promise<Product[]>
}

function matchesQuery(entry: ProductIndexEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  return (
    entry.title.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q) ||
    entry.tags.some((tag) => tag.toLowerCase().includes(q))
  )
}

export function createProductCatalogService(repository: ProductRepository): ProductCatalogService {
  async function loadFullProducts(entries: ProductIndexEntry[]): Promise<Product[]> {
    const products = await Promise.all(entries.map((entry) => repository.loadProduct(entry.id)))
    return products.filter((p): p is Product => Boolean(p))
  }

  return {
    async getAll() {
      const index = await repository.loadIndex()
      return loadFullProducts(index.products)
    },

    getById(id) {
      return repository.loadProduct(id)
    },

    async getBySlug(slug) {
      const index = await repository.loadIndex()
      const entry = index.products.find((p) => p.slug === slug)
      return entry ? repository.loadProduct(entry.id) : undefined
    },

    async getFeatured() {
      const index = await repository.loadIndex()
      return loadFullProducts(index.products.filter((entry) => entry.featured))
    },

    async getByCategory(category) {
      const index = await repository.loadIndex()
      return loadFullProducts(index.products.filter((entry) => entry.category === category))
    },

    async getByIndustry(industry) {
      // `industry` isn't on the lightweight index entry (it's a marketing
      // field, not a filter/search field on ProductIndexEntry — see
      // types/product.ts), so this loads full products first. Fine at this
      // catalog's current size; revisit if a future Studio-published index
      // adds industry to the index shape.
      const index = await repository.loadIndex()
      const all = await loadFullProducts(index.products)
      return all.filter((p) => p.industry === industry)
    },

    async getRelatedProducts(productId) {
      const product = await repository.loadProduct(productId)
      const ids = product?.relatedProductIds ?? []
      if (ids.length === 0) return []
      const related = await Promise.all(ids.map((id) => repository.loadProduct(id)))
      return related.filter((p): p is Product => Boolean(p))
    },

    async search(query) {
      const index = await repository.loadIndex()
      return loadFullProducts(index.products.filter((entry) => matchesQuery(entry, query)))
    },
  }
}

// Ready-to-use singleton every Website page/component reads through —
// backed by the Static Product Repository (see store/staticProductRepository.ts).
export const productCatalogService: ProductCatalogService = createProductCatalogService(createStaticProductRepository())
