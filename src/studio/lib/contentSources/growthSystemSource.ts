import { getAllSystems, getSystemBySlug } from '../../../data/systems'
import type { ContentSourceProvider, ContentSourceSnapshot } from './types'
import type { ProductDifficulty } from '../../../modules/commerce/types/product'

// The only real Content Source provider today — wraps data/systems.ts
// read-only, exactly as workspaceImport.ts's applyWorkspaceToProductDraft
// did before the Content Source concept generalized it. Every future
// provider (Planner, Calculator, Academy course, Template Pack) follows
// this same shape once its own builder exists — see registry.ts.
function loadSnapshot(id: string): ContentSourceSnapshot | undefined {
  const system = getSystemBySlug(id)
  if (!system) return undefined
  return {
    title: system.title,
    description: system.shortDescription,
    longDescription: system.description,
    industry: system.industry,
    category: system.category,
    difficulty: system.difficulty as ProductDifficulty,
    estimatedTime: system.estimatedTime,
    thumbnail: system.thumbnail,
    // Type + title only — never the module's `content` (sections/fields).
    // Informational, for the Content Source tab / preview to show what the
    // Workspace contains; never written onto the Product itself.
    modules: system.modules.map((m) => ({ id: m.id, title: m.title, type: m.type })),
  }
}

export const growthSystemSource: ContentSourceProvider = {
  type: 'GrowthSystem',
  label: 'Workspace',

  list() {
    return getAllSystems().map((s) => ({ id: s.slug, label: s.title }))
  },

  load(id) {
    return loadSnapshot(id)
  },

  applyToProduct(product, id) {
    const snapshot = loadSnapshot(id)
    if (!snapshot) return product
    return {
      ...product,
      title: snapshot.title,
      description: snapshot.description,
      longDescription: snapshot.longDescription,
      industry: snapshot.industry,
      difficulty: snapshot.difficulty,
      estimatedTime: snapshot.estimatedTime,
      assets: { ...product.assets, thumbnail: snapshot.thumbnail ?? product.assets.thumbnail },
      source: { type: 'GrowthSystem', id },
    }
  },
}
