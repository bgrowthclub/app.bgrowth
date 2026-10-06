import { useEffect, useState } from 'react'
import { WORKSPACE_CATEGORIES, type WorkspaceCategory } from '../data/workspaceCategories'
import { loadStudioWorkspaceProducts } from './publishedCatalog'

// The six Workspace™ category cards with live counts: how many published
// Studio Workspaces sit in each card's Areas (Admin → Categories). Starts
// at 0 and fills in once the catalog loads.
export function useWorkspaceCategories(): WorkspaceCategory[] {
  const [categories, setCategories] = useState<WorkspaceCategory[]>(WORKSPACE_CATEGORIES)

  useEffect(() => {
    let cancelled = false
    loadStudioWorkspaceProducts()
      .then((products) => {
        if (cancelled) return
        setCategories(
          WORKSPACE_CATEGORIES.map((c) => ({
            ...c,
            count: products.filter((p) => (c.areas as string[]).includes(p.category)).length,
          })),
        )
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return categories
}

// Where a category card with Workspaces leads: the catalog filtered to its
// first Area.
export function categoryCatalogPath(category: WorkspaceCategory): string {
  return `/systems?area=${category.areas[0]}`
}
