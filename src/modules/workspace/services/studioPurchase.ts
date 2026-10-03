import { supabase } from '../../identity/supabase/supabaseClient'
import { studioWorkspaceService } from './studioWorkspaceService'
import { canOpen, deriveAccessState } from '../lib/access'
import type { StudioAccessState } from '../lib/access'

// Everything the product page needs to sell a Studio Workspace, and the
// two ways to get one here: buy (or claim free) through /api/studio-checkout,
// or start the one free trial a member gets — the same rules as the Portal.

export interface StudioPurchaseInfo {
  productId: string
  isFree: boolean
  trialDays: number | null
  accessState: StudioAccessState
  owned: boolean
  // True when this member may still start a trial of this Workspace.
  canStartTrial: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

function client() {
  if (!supabase) throw new Error('Sign-in isn’t available right now.')
  return supabase
}

export async function loadStudioPurchaseInfo(slug: string, userId: string | undefined): Promise<StudioPurchaseInfo | null> {
  const product = await studioWorkspaceService.getProductBySlug(slug)
  if (!product) return null
  const trialDays = product.is_trial_eligible && product.trial_duration ? product.trial_duration : null

  if (!userId) {
    return { productId: product.id, isFree: product.is_free, trialDays, accessState: 'locked', owned: false, canStartTrial: false }
  }

  const [licenses, grants, profile] = await Promise.all([
    studioWorkspaceService.listLicenses(userId),
    studioWorkspaceService.listAccessGrants(userId),
    client().from('users').select('has_used_trial').eq('id', userId).limit(1),
  ])
  if (profile.error) throw profile.error
  const license = licenses.find((l) => l.product_id === product.id) ?? null
  const hasGrant = grants.some(
    (g) =>
      g.revoked_at === null &&
      (g.expires_at === null || new Date(g.expires_at).getTime() > Date.now()) &&
      (g.scope === 'all' || g.product_id === product.id),
  )
  const accessState = deriveAccessState(license, hasGrant)
  const hasUsedTrial = Boolean((profile.data?.[0] as { has_used_trial?: boolean } | undefined)?.has_used_trial)

  return {
    productId: product.id,
    isFree: product.is_free,
    trialDays,
    accessState,
    owned: canOpen(accessState),
    canStartTrial: Boolean(trialDays) && !product.is_free && !hasUsedTrial && !license && !canOpen(accessState),
  }
}

// Buy (paid → Stripe Checkout URL) or claim (free → the Workspace's path).
export async function startStudioCheckout(slug: string): Promise<{ checkoutUrl?: string; redirectUrl?: string }> {
  const { data } = await client().auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sign in to continue.')

  const response = await fetch('/api/studio-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productSlug: slug }),
  })
  const json = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    checkoutUrl?: string
    redirectUrl?: string
    error?: string
  }
  if (!response.ok || !json.ok) throw new Error(json.error ?? 'Checkout isn’t available right now. Please try again.')
  return { checkoutUrl: json.checkoutUrl, redirectUrl: json.redirectUrl }
}

// The member's one free trial — same insert as the Portal's
// licenseService.activateTrial(); the database still enforces "one trial
// per member, ever" (unique index + RLS).
export async function startStudioTrial(userId: string, productId: string, trialDays: number): Promise<void> {
  const activatedAt = new Date()
  const { error } = await client()
    .from('licenses')
    .insert({
      user_id: userId,
      product_id: productId,
      type: 'trial',
      status: 'active',
      activated_at: activatedAt.toISOString(),
      expires_at: new Date(activatedAt.getTime() + trialDays * DAY_MS).toISOString(),
    })
  if (error) {
    if (error.code === '23505') throw new Error('You’ve already used your free trial.')
    throw error
  }
}
