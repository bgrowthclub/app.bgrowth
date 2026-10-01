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
  // What failed, for the error screen (step + database message).
  error?: string
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
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!slug || !userId) return
    let cancelled = false
    setStatus('loading')
    setError(undefined)
    let step = 'product'
    ;(async () => {
      try {
        const found = await studioWorkspaceService.getProductBySlug(slug)
        if (cancelled) return
        if (!found) {
          setStatus('not-found')
          return
        }
        step = 'licenses'
        const licenses = await studioWorkspaceService.listLicenses(userId)
        step = 'access grants'
        const grants = await studioWorkspaceService.listAccessGrants(userId)
        step = 'records'
        const instances = await studioWorkspaceService.listInstances(userId, found.id)
        if (cancelled) return
        const own = licenses.find((l) => l.product_id === found.id) ?? null
        setProduct(found)
        setLicense(own)
        setAccessState(deriveAccessState(own, hasActiveGrantFor(grants, found.id)))
        setRecords(instances)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        const message =
          err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err)
        console.error(`[Workspace viewer] Failed loading ${step}:`, err)
        setError(`${step}: ${message}`)
        setStatus('error')
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
    error,
  }
}
