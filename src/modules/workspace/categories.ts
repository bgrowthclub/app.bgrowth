import { GROWTH_CATEGORIES } from '../../types/growth'
import type { GrowthCategoryId } from '../../types/growth'
import type { PortalCategoryRow } from './types/portal'

// Where a Workspace sits in the catalog, from its one category_id (Portal
// migration 0032): a category inside an Area gives both; an Area by itself
// gives just the Area. Unknown or missing → Business & Entrepreneurship.
export interface CategoryPlacement {
  area: GrowthCategoryId
  // The category's name inside the Area (e.g. "Notary") — the catalog's
  // category filter. Undefined for a general Workspace.
  industry?: string
}

const AREA_IDS = new Set<string>(GROWTH_CATEGORIES.map((c) => c.id))
const DEFAULT_AREA: GrowthCategoryId = 'business-entrepreneurship'

function asArea(slug: string | undefined): GrowthCategoryId {
  return slug && AREA_IDS.has(slug) ? (slug as GrowthCategoryId) : DEFAULT_AREA
}

export function categoryResolver(categories: PortalCategoryRow[]) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  return (categoryId: string | null | undefined): CategoryPlacement => {
    const category = categoryId ? byId.get(categoryId) : undefined
    if (!category) return { area: DEFAULT_AREA }
    const parent = category.parent_id ? byId.get(category.parent_id) : undefined
    if (parent) return { area: asArea(parent.slug), industry: category.name }
    // An Area itself, or a pre-0032 category without a parent.
    return AREA_IDS.has(category.slug) ? { area: asArea(category.slug) } : { area: DEFAULT_AREA, industry: category.name }
  }
}

export type ResolveCategory = ReturnType<typeof categoryResolver>
