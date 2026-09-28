import type { PortalAccessGrantRow, PortalLicenseRow } from '../types/portal'

// Same rule as the Portal's portal.has_workspace_access() and
// lib/workspaceAccess.ts: an active, unexpired license (trial or purchase)
// OR an active, unexpired access grant (specific or "all") = access.

export type StudioAccessState = 'trial' | 'purchased' | 'unlocked' | 'expired' | 'locked'

export function isGrantActive(grant: PortalAccessGrantRow, now = Date.now()): boolean {
  return grant.revoked_at === null && (grant.expires_at === null || new Date(grant.expires_at).getTime() > now)
}

export function hasActiveGrantFor(grants: PortalAccessGrantRow[], productId: string): boolean {
  return grants.some((g) => isGrantActive(g) && (g.scope === 'all' || g.product_id === productId))
}

export function deriveAccessState(license: PortalLicenseRow | null, hasActiveGrant: boolean): StudioAccessState {
  if (!license) return hasActiveGrant ? 'unlocked' : 'locked'
  const expired =
    license.status === 'expired' ||
    (license.access_policy === 'expiring' && license.expires_at !== null && new Date(license.expires_at) < new Date())
  if (expired) return hasActiveGrant ? 'unlocked' : 'expired'
  if (license.status !== 'active') return hasActiveGrant ? 'unlocked' : 'locked'
  return license.type === 'trial' ? 'trial' : 'purchased'
}

export function canOpen(state: StudioAccessState): boolean {
  return state === 'trial' || state === 'purchased' || state === 'unlocked'
}
