import { useEffect, useState } from 'react'
import { studioWorkspaceService } from '../modules/workspace/services/studioWorkspaceService'

// Tag names by Portal product id (Admin → Catalog → Tags and the Studio's
// publish screens, Portal migration 0048). Empty until it loads.
export function useProductTags() {
  const [tags, setTags] = useState<Map<string, string[]>>(new Map())
  useEffect(() => {
    let cancelled = false
    studioWorkspaceService
      .listProductTags()
      .then((rows) => {
        if (!cancelled) setTags(new Map(rows.map((r) => [r.productId, r.tags])))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  return tags
}
