import { useEffect, useState } from 'react'
import { studioWorkspaceService } from '../modules/workspace/services/studioWorkspaceService'

export interface CategoryLookKeys {
  icon?: string | null
  color?: string | null
}

// Each area/category's icon and color (Admin → Catalog → Categories,
// Portal migration 0047), by slug and by name — products carry the
// category's name as their industry. Empty until it loads (or when the
// catalog isn't available): callers then show no icon.
export function useCategoryLooks() {
  const [looks, setLooks] = useState<{ bySlug: Map<string, CategoryLookKeys>; byName: Map<string, CategoryLookKeys> }>({
    bySlug: new Map(),
    byName: new Map(),
  })
  useEffect(() => {
    let cancelled = false
    studioWorkspaceService
      .listCategories()
      .then((rows) => {
        if (cancelled) return
        const withLook = rows.filter((r) => r.icon || r.color)
        setLooks({
          bySlug: new Map(withLook.map((r) => [r.slug, { icon: r.icon, color: r.color }])),
          byName: new Map(withLook.map((r) => [r.name, { icon: r.icon, color: r.color }])),
        })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  return looks
}
