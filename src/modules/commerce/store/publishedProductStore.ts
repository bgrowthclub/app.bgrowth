import type { Product } from '../types/product'
import { MOCK_PRODUCTS } from '../mock/mockProducts'

// The Published Product Repository — the boundary Studio's Publish action
// writes across (see ProductAdminService.publish/archive) and everything
// the Runtime reads through (see publishedProductRepository.ts,
// ProductService.ts). In-memory today; a RemoteProductRepository backed by
// a RemoteProductSource (GitHub, S3, an API, ...) replaces this array —
// nothing above this layer (ProductService or any page/component) changes
// when that happens. Deliberately a separate array from MOCK_PRODUCTS
// (Studio's draft/admin working store): a product can be edited further
// after publishing without any of those edits going live until Publish is
// clicked again.
//
// Seeded once from whatever the mock catalog already marked `published` —
// standing in for products that were already published through Studio
// before this session started.
let PUBLISHED_PRODUCTS: Product[] = MOCK_PRODUCTS.filter((p) => p.status === 'published')

export function listPublishedProducts(): Product[] {
  return PUBLISHED_PRODUCTS
}

export function getPublishedProduct(id: string): Product | undefined {
  return PUBLISHED_PRODUCTS.find((p) => p.id === id)
}

export function upsertPublishedProduct(product: Product): void {
  const index = PUBLISHED_PRODUCTS.findIndex((p) => p.id === product.id)
  if (index >= 0) {
    PUBLISHED_PRODUCTS = [...PUBLISHED_PRODUCTS.slice(0, index), product, ...PUBLISHED_PRODUCTS.slice(index + 1)]
  } else {
    PUBLISHED_PRODUCTS = [...PUBLISHED_PRODUCTS, product]
  }
}

export function removePublishedProduct(id: string): void {
  PUBLISHED_PRODUCTS = PUBLISHED_PRODUCTS.filter((p) => p.id !== id)
}
