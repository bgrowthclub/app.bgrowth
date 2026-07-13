import type { ProductRepository } from '../services/ProductRepository'
import { listPublishedProducts, getPublishedProduct } from './publishedProductStore'

// The concrete ProductRepository the Runtime's productService singleton is
// built on (see services/ProductService.ts) — reads only from the
// Published Product Repository, never from Studio's draft store
// (mock/mockProducts.ts's MOCK_PRODUCTS), so a page/component consuming
// ProductService can never accidentally render an unpublished draft. Same
// index-first shape as mock/mockProducts.ts's createLocalProductRepository
// (used by ProductAdminService's Studio-facing reads); this is the one
// that becomes a RemoteProductRepository once a real Remote Product Source
// exists.
export function createPublishedProductRepository(): ProductRepository {
  return {
    async loadIndex() {
      return {
        generatedAt: new Date().toISOString(),
        products: listPublishedProducts().map(
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
      return getPublishedProduct(id)
    },
  }
}
