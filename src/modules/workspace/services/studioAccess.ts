import type { ProductAccess } from '../../commerce/types/access'
import { studioWorkspaceService, isStudioCatalogAvailable } from './studioWorkspaceService'
import { canOpen, deriveAccessState, isGrantActive } from '../lib/access'

export interface StudioProductAccess extends ProductAccess {
  lastOpenedAt?: string
}

// A member's access to Studio-published Workspaces, as Commerce's
// ProductAccess (productId = "studio-<portal id>", the id the catalog uses
// — see commerce/store/studioProductRepository.ts). Same OR-rule as the
// Portal: live license (trial or purchase) or active access grant.
export async function listStudioProductAccess(memberId: string): Promise<StudioProductAccess[]> {
  if (!isStudioCatalogAvailable) return []
  const [licenses, grants] = await Promise.all([
    studioWorkspaceService.listLicenses(memberId),
    studioWorkspaceService.listAccessGrants(memberId),
  ])
  const activeGrants = grants.filter((g) => isGrantActive(g))
  const allGrant = activeGrants.find((g) => g.scope === 'all')

  const productIds = new Set<string>([
    ...licenses.map((l) => l.product_id),
    ...activeGrants.flatMap((g) => (g.scope === 'specific' && g.product_id ? [g.product_id] : [])),
  ])
  // An "all Workspaces" grant covers every published Workspace.
  if (allGrant) {
    for (const p of await studioWorkspaceService.listPublishedProducts()) productIds.add(p.id)
  }

  const result: StudioProductAccess[] = []
  for (const productId of productIds) {
    const license = licenses.find((l) => l.product_id === productId) ?? null
    const grant = activeGrants.find((g) => g.scope === 'all' || g.product_id === productId)
    const state = deriveAccessState(license, Boolean(grant))
    if (!canOpen(state)) continue
    result.push({
      productId: `studio-${productId}`,
      memberId,
      hasAccess: true,
      source: state === 'trial' ? 'trial' : state === 'unlocked' ? 'gift' : 'purchase',
      grantedAt: license?.activated_at ?? grant?.created_at ?? new Date().toISOString(),
      expiresAt: state === 'trial' ? license?.expires_at ?? undefined : undefined,
      lastOpenedAt: license?.last_opened_at ?? undefined,
    })
  }
  return result
}
