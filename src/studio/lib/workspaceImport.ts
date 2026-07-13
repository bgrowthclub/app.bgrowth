import type { BusinessSystem } from '../../types/system'
import type { Product, ProductDifficulty } from '../../modules/commerce/types/product'

// The one place a selected Workspace's fields are mapped onto a Product
// draft — read-only on the Workspace side. This never writes back to
// data/systems.ts; it only snapshots a few fields onto the Product being
// edited. Called once, when a Workspace is chosen on the Workspace tab;
// every field it sets becomes a normal, independently-editable Product
// field afterward ("allow manual override if necessary" — that override
// is just the General tab's own inputs, no special-cased logic here).
export function applyWorkspaceToProductDraft(product: Product, system: BusinessSystem): Product {
  return {
    ...product,
    title: system.title,
    description: system.shortDescription,
    longDescription: system.description,
    industry: system.industry,
    difficulty: system.difficulty as ProductDifficulty,
    estimatedTime: system.estimatedTime,
    thumbnail: system.thumbnail,
    source: { type: 'GrowthSystem', id: system.slug },
  }
}
