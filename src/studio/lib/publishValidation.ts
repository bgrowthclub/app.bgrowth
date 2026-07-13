import type { Product } from '../../modules/commerce/types/product'

export interface ValidationCheck {
  label: string
  passed: boolean
}

// The Publishing tab's checklist — every check here must pass before
// Publish is enabled. Kept as plain data (not baked into the UI) so the
// same list drives both the checklist display and the Publish button's
// disabled state.
export function getPublishValidation(product: Product): ValidationCheck[] {
  return [
    { label: 'Required fields complete', passed: Boolean(product.title && product.slug && product.description) },
    { label: 'Workspace selected', passed: Boolean(product.source) },
    { label: 'Price configured', passed: product.price > 0 || product.visibility === 'free' },
    { label: 'Thumbnail uploaded', passed: Boolean(product.thumbnail) },
    { label: 'SEO completed', passed: Boolean(product.seo?.metaTitle && product.seo?.metaDescription) },
  ]
}

export function isReadyToPublish(product: Product): boolean {
  return getPublishValidation(product).every((check) => check.passed)
}
