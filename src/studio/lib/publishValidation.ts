import type { Product } from '../../modules/commerce/types/product'

export interface ValidationCheck {
  label: string
  passed: boolean
}

// The Publishing tab's checklist — every check here must pass before
// Publish is enabled. Kept as plain data (not baked into the UI) so the
// same list drives both the checklist display and the Publish button's
// disabled state. Covers every dependency a published product actually
// needs, not just its own fields: a Content Source, priced correctly,
// its core assets, and SEO.
export function getPublishValidation(product: Product): ValidationCheck[] {
  return [
    { label: 'Required fields complete', passed: Boolean(product.title && product.slug && product.description) },
    { label: 'Content source selected', passed: Boolean(product.source) },
    { label: 'Price configured', passed: product.price > 0 || product.visibility === 'free' },
    { label: 'Thumbnail uploaded', passed: Boolean(product.assets.thumbnail) },
    { label: 'Hero image uploaded', passed: Boolean(product.assets.heroImage) },
    { label: 'SEO completed', passed: Boolean(product.seo?.metaTitle && product.seo?.metaDescription) },
  ]
}

export function isReadyToPublish(product: Product): boolean {
  return getPublishValidation(product).every((check) => check.passed)
}
