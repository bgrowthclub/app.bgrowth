import { WORKSPACE_CATEGORIES } from '../../data/workspaceCategories'
import type { WorkspaceCategory } from '../../data/workspaceCategories'
import { categoryResolver } from '../workspace/categories'
import type { PortalCategoryRow } from '../workspace/types/portal'

// A Journey's Life World comes from its product category (category → Area →
// Life World), the same way the catalog places a Workspace. No category =
// no Life World shown.
export function lifeWorldResolver(categories: PortalCategoryRow[]) {
  const resolve = categoryResolver(categories)
  return (categoryId: string | null): WorkspaceCategory | undefined => {
    if (!categoryId) return undefined
    const { area } = resolve(categoryId)
    return WORKSPACE_CATEGORIES.find((w) => w.areas.includes(area))
  }
}
