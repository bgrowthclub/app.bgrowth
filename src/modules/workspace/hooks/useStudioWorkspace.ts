import { useCallback, useEffect, useState } from 'react'
import { studioWorkspaceService } from '../services/studioWorkspaceService'
import { canOpen, deriveAccessState, hasActiveGrantFor } from '../lib/access'
import type { StudioAccessState } from '../lib/access'
import type { PortalLicenseRow, PortalProductRow, WorkspaceInstanceRow } from '../types/portal'

export interface StudioWorkspaceState {
  status: 'loading' | 'ready' | 'not-found' | 'error'
  product: PortalProductRow | null
  license: PortalLicenseRow | null
  accessState: StudioAccessState
  hasAccess: boolean
  records: WorkspaceInstanceRow[]
  reloadRecords: () => Promise<void>
  retry: () => void
}

// Everything the Workspace viewer needs for one product and one member:
// the published product (content JSON), the member's access to it (same
// OR-rule as the Portal), and their saved records of it.
export function useStudioWorkspace(slug: string | undefined, userId: string | undefined): StudioWorkspaceState {
  const [status, setStatus] = useState<StudioWorkspaceState['status']>('loading')
  const [product, setProduct] = useState<PortalProductRow | null>(null)
  const [license, setLicense] = useState<PortalLicenseRow | null>(null)
  const [accessState, setAccessState] = useState<StudioAccessState>('locked')
  const [records, setRecords] = useState<WorkspaceInstanceRow[]>([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!slug || !userId) return
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      try {
        const found = await studioWorkspaceService.getProductBySlug(slug)
        if (cancelled) return
        if (!found) {
          setStatus('not-found')
          return
        }
        const [licenses, grants, instances] = await Promise.all([
          studioWorkspaceService.listLicenses(userId),
          studioWorkspaceService.listAccessGrants(userId),
          studioWorkspaceService.listInstances(userId, found.id),
        ])
        if (cancelled) return
        const own = licenses.find((l) => l.product_id === found.id) ?? null
        setProduct(found)
        setLicense(own)
        setAccessState(deriveAccessState(own, hasActiveGrantFor(grants, found.id)))
        setRecords(instances)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, userId, attempt])

  const reloadRecords = useCallback(async () => {
    if (!userId || !product) return
    setRecords(await studioWorkspaceService.listInstances(userId, product.id))
  }, [userId, product])

  return {
    status,
    product,
    license,
    accessState,
    hasAccess: canOpen(accessState),
    records,
    reloadRecords,
    retry: () => setAttempt((n) => n + 1),
  }
}
