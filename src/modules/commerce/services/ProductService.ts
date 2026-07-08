import type { Product, ProductType, ProductStatus } from '../types/product'
import type { GrowthCategoryId } from '../../../types/growth'

// Interface only — no implementation. A future concrete implementation
// (backed by mock data today, a real API later) is what the rest of the
// app is expected to depend on instead of reading Product data directly.
export interface ProductService {
  getProductById(id: string): Promise<Product | undefined>
  getProductBySlug(slug: string): Promise<Product | undefined>
  listProducts(filter?: {
    category?: GrowthCategoryId
    type?: ProductType
    status?: ProductStatus
  }): Promise<Product[]>
  searchProducts(query: string): Promise<Product[]>
}
