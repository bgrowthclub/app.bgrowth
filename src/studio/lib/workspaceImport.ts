import type { BusinessSystem } from '../../types/system'
import type { Product, ProductDifficulty } from '../../modules/commerce/types/product'

// Superseded by lib/contentSources/growthSystemSource.ts, which the
// Product Engine's ContentSourceTab now calls instead — left in place,
// unused, per CLAUDE.md §12/§18 (never delete a component on your own
// initiative; recommend removal and wait for approval). Kept compiling
// against the current Product shape since WorkspaceTab.tsx (also unused,
// same reason) still references it.
export function applyWorkspaceToProductDraft(product: Product, system: BusinessSystem): Product {
  return {
    ...product,
    title: system.title,
    description: system.shortDescription,
    longDescription: system.description,
    industry: system.industry,
    difficulty: system.difficulty as ProductDifficulty,
    estimatedTime: system.estimatedTime,
    assets: { ...product.assets, thumbnail: system.thumbnail ?? product.assets.thumbnail },
    source: { type: 'GrowthSystem', id: system.slug },
  }
}
