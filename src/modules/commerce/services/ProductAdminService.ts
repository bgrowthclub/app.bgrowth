import type { Product } from '../types/product'
import { MOCK_PRODUCTS } from '../mock/mockProducts'

// The write counterpart to ProductService (read-only, used by the
// Runtime/website side). ProductAdminService exists specifically for the
// Product Engine (see src/studio/) — the Runtime never imports this.
// Backed by the same MOCK_PRODUCTS array ProductService's local repository
// reads from, so a save here is immediately visible to both, exactly like
// a shared database would be. A future real implementation swaps the
// backing store for an API/database call; this interface doesn't change.
export interface ProductAdminService {
  getAll(): Promise<Product[]>
  getById(id: string): Promise<Product | undefined>
  // Creates the product if `id` isn't already present, otherwise updates
  // it in place. Does not change `status` — see publish/archive for that.
  save(product: Product): Promise<Product>
  publish(id: string): Promise<Product>
  archive(id: string): Promise<Product>
}

export function createProductAdminService(): ProductAdminService {
  function requireProduct(id: string): Product {
    const product = MOCK_PRODUCTS.find((p) => p.id === id)
    if (!product) throw new Error(`Product "${id}" not found`)
    return product
  }

  return {
    async getAll() {
      return MOCK_PRODUCTS
    },

    async getById(id) {
      return MOCK_PRODUCTS.find((p) => p.id === id)
    },

    async save(product) {
      const now = new Date().toISOString()
      const saved: Product = { ...product, createdAt: product.createdAt ?? now, updatedAt: now }
      const index = MOCK_PRODUCTS.findIndex((p) => p.id === product.id)
      if (index >= 0) {
        MOCK_PRODUCTS[index] = saved
      } else {
        MOCK_PRODUCTS.push(saved)
      }
      return saved
    },

    async publish(id) {
      const product = requireProduct(id)
      product.status = 'published'
      product.updatedAt = new Date().toISOString()
      return product
    },

    async archive(id) {
      const product = requireProduct(id)
      product.status = 'archived'
      product.updatedAt = new Date().toISOString()
      return product
    },
  }
}

export const productAdminService: ProductAdminService = createProductAdminService()
