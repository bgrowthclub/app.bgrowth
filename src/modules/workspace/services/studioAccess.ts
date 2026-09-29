import type { ProductAccess } from '../../commerce/types/access'
import type { Product } from '../../commerce/types/product'
import { studioProductFromRow } from '../../commerce/store/studioProductRepository'
import { studioWorkspaceService, isStudioCatalogAvailable } from './studioWorkspaceService'
import { deriveAccessState, isGrantActive } from '../lib/access'
import type { StudioAccessState } from '../lib/access'
import type { PortalProductRow } from '../types/portal'

export interface StudioProductAccess extends ProductAccess {
  lastOpenedAt?: string
  accessState: StudioAccessState
}

export interface StudioLibraryItem {
  product: Product
  access: StudioProductAccess
}

// A member's Studio Workspaces — the same list the Portal's "My Library"
// shows: everything they can open (live license or active access grant —
// the portal.has_workspace_access() rule) plus anything whose access has
// ended (a finished trial, marked so it can be bought). Loaded in one batch: the
// member's licenses and grants, then every product involved in a single
// query (RLS returns published products, and archived ones the member
// owns).
export async function listStudioLibrary(memberId: string): Promise<StudioLibraryItem[]> {
  if (!isStudioCatalogAvailable) return []
  const [licenses, grants, categories] = await Promise.all([
    studioWorkspaceService.listLicenses(memberId),
    studioWorkspaceService.listAccessGrants(memberId),
    studioWorkspaceService.listCategories(),
  ])
  const activeGrants = grants.filter((g) => isGrantActive(g))
  const hasAllGrant = activeGrants.some((g) => g.scope === 'all')

  const ids = new Set<string>([
    ...licenses.map((l) => l.product_id),
    ...activeGrants.flatMap((g) => (g.scope === 'specific' && g.product_id ? [g.product_id] : [])),
  ])
  let rows: PortalProductRow[] = await studioWorkspaceService.getProductsByIds([...ids])
  // An "all Workspaces" grant covers every published Workspace.
  if (hasAllGrant) {
    const published = await studioWorkspaceService.listPublishedProducts()
    const seen = new Set(rows.map((r) => r.id))
    rows = [...rows, ...published.filter((p) => !seen.has(p.id))]
  }

  const categoryName = new Map(categories.map((c) => [c.id, c.name]))
  const items: StudioLibraryItem[] = []
  for (const row of rows) {
    if (row.content_type !== 'workspace') continue
    const license = licenses.find((l) => l.product_id === row.id) ?? null
    const grant = activeGrants.find((g) => g.scope === 'all' || g.product_id === row.id)
    const accessState = deriveAccessState(license, Boolean(grant))
    if (accessState === 'locked') continue
    items.push({
      product: studioProductFromRow(row, row.category_id ? categoryName.get(row.category_id) : undefined),
      access: {
        productId: `studio-${row.id}`,
        memberId,
        hasAccess: accessState !== 'expired',
        source: accessState === 'unlocked' ? 'gift' : license?.type === 'trial' ? 'trial' : 'purchase',
        grantedAt: license?.activated_at ?? grant?.created_at ?? row.created_at,
        expiresAt: license?.access_policy === 'expiring' ? license.expires_at ?? undefined : undefined,
        lastOpenedAt: license?.last_opened_at ?? undefined,
        accessState,
      },
    })
  }
  return items
}
