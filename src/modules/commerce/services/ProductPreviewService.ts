import type { Product } from '../types/product'

// The contract a future "Preview Website" feature will consume — a
// point-in-time render of an unpublished draft, entirely separate from
// ProductService (published, read-only, Runtime-facing) and
// ProductAdminService (the admin write path). No dedicated route renders
// this payload yet — the Product Engine's Publishing tab is the only
// consumer today, rendering it inline (see components/PreviewDialog.tsx)
// instead of on its own page. A real Preview Website route would import
// this same service and payload shape rather than inventing a new one.
export interface ProductPreviewPayload {
  product: Product
  generatedAt: string
}

export interface ProductPreviewService {
  generatePreview(product: Product): ProductPreviewPayload
}

export function createProductPreviewService(): ProductPreviewService {
  return {
    generatePreview(product) {
      return { product, generatedAt: new Date().toISOString() }
    },
  }
}

export const productPreviewService: ProductPreviewService = createProductPreviewService()
