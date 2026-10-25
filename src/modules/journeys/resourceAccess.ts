import { canOpen, deriveAccessState, hasActiveGrantFor } from '../workspace/lib/access'
import type { PortalAccessGrantRow, PortalLicenseRow } from '../workspace/types/portal'
import { safeHttpsUrl } from './journeyService'
import type { JourneyAction } from './types'

// What a member can do with the resource behind one Journey action — read
// from the access the site already knows (licenses, team access grants,
// what their plan includes: the same rule as portal.has_workspace_access()).
// Taking part in a Journey never opens a product by itself. Pure: the data
// is loaded by the page.

export type ActionAccess =
  | { kind: 'task' }
  | { kind: 'coming_soon' }
  | { kind: 'unavailable' }
  /** Opens inside the member area (owned, trial, team access or plan). */
  | { kind: 'open'; to: string; label: string; viaPlan?: string; trial?: boolean }
  /** Free product the member hasn't taken yet: get it on its product page. */
  | { kind: 'get_free'; to: string }
  /** Paid product: buy it on its page; planName when a plan includes it. */
  | { kind: 'locked'; to: string; priceCents: number | null; currency: string | null; planName: string | null; trialEnded?: boolean }
  /** A bundle: its own page lists what's inside and what the member already has. */
  | { kind: 'bundle'; to: string; priceCents: number | null; currency: string | null }
  | { kind: 'article'; to: string; access: string; requiredPlanName: string | null }
  | { kind: 'external'; href: string; label: string }

export interface MemberAccess {
  licenses: PortalLicenseRow[]
  grants: PortalAccessGrantRow[]
  /** product id → the lowest plan that includes it (portal.product_plan_access), when known. */
  includedPlan: Record<string, string | null>
}

export function actionAccess(action: JourneyAction, member: MemberAccess): ActionAccess {
  if (action.kind === 'manual') return action.state === 'available' ? { kind: 'task' } : { kind: action.state === 'coming_soon' ? 'coming_soon' : 'unavailable' }
  if (action.state === 'coming_soon') return { kind: 'coming_soon' }
  if (action.state !== 'available' || !action.ref) return { kind: 'unavailable' }

  const ref = action.ref
  if (action.kind === 'article' && 'title' in ref) {
    return { kind: 'article', to: `/knowledge/article/${encodeURIComponent(ref.slug)}`, access: ref.access, requiredPlanName: ref.requiredPlanName }
  }
  if ((action.kind === 'video' || action.kind === 'link') && 'url' in ref) {
    const href = safeHttpsUrl(ref.url)
    return href ? { kind: 'external', href, label: action.kind === 'video' ? 'Watch' : 'Open link' } : { kind: 'unavailable' }
  }
  if (action.kind === 'product' && 'productId' in ref) {
    const slug = encodeURIComponent(ref.slug)
    if (ref.contentType === 'bundle') return { kind: 'bundle', to: `/bundle/${slug}`, priceCents: ref.priceCents, currency: ref.currency }
    const license = member.licenses.find((l) => l.product_id === ref.productId) ?? null
    const grant = hasActiveGrantFor(member.grants, ref.productId)
    const state = deriveAccessState(license, grant)
    if (canOpen(state)) {
      const viaPlan = !license && grant ? member.grants.find((g) => g.via_plan && (g.scope === 'all' || g.product_id === ref.productId))?.via_plan : undefined
      return { kind: 'open', to: `/platform/workspace/${slug}`, label: ref.contentType === 'pdf' ? 'Download' : 'Open', viaPlan, trial: state === 'trial' }
    }
    if (ref.isFree) return { kind: 'get_free', to: `/product/${slug}` }
    return {
      kind: 'locked',
      to: `/product/${slug}`,
      priceCents: ref.priceCents,
      currency: ref.currency,
      planName: member.includedPlan[ref.productId] ?? null,
      trialEnded: state === 'expired',
    }
  }
  return { kind: 'unavailable' }
}

/** Paid products the member can't open — the ones worth asking "which plan includes it?". */
export function lockedProductIds(actions: JourneyAction[], member: Omit<MemberAccess, 'includedPlan'>): string[] {
  const ids = new Set<string>()
  for (const action of actions) {
    if (action.kind !== 'product' || action.state !== 'available' || !action.ref || !('productId' in action.ref)) continue
    const ref = action.ref
    if (ref.contentType === 'bundle' || ref.isFree) continue
    const license = member.licenses.find((l) => l.product_id === ref.productId) ?? null
    if (!canOpen(deriveAccessState(license, hasActiveGrantFor(member.grants, ref.productId)))) ids.add(ref.productId)
  }
  return [...ids]
}
