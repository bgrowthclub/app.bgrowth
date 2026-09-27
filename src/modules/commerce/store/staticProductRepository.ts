import type { ProductRepository } from '../services/ProductRepository'
import { STATIC_PRODUCTS } from '../../../data/products/staticProducts'

// The temporary repository behind ProductCatalogService (see
// services/ProductCatalogService.ts) — implements the exact same
// ProductRepository interface the Runtime↔Product Engine connection
// already defined, just backed by a hand-authored static list
// (data/products/staticProducts.ts) instead of Studio's draft mock. When
// the Product Engine ships, a ProductEngineRepository implementing this
// same interface against a real database replaces this file — nothing
// else in the app changes.
export function createStaticProductRepository(): ProductRepository {
  return {
    async loadIndex() {
      return {
        generatedAt: new Date().toISOString(),
        products: STATIC_PRODUCTS.map(
          ({ id, slug, title, description, type, category, status, featured, tags }) => ({
            id,
            slug,
            title,
            description,
            type,
            category,
            status,
            featured,
            tags,
          }),
        ),
      }
    },

    async loadProduct(id) {
      return STATIC_PRODUCTS.find((p) => p.id === id)
    },
  }
}
