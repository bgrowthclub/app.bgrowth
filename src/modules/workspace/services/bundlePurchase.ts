import { studioWorkspaceService } from './studioWorkspaceService'
import { postStudioCheckout } from './studioPurchase'
import { deriveAccessState } from '../lib/access'
import { bundleAmountDueCents, toCents as cents } from '../lib/bundlePrice'
import { studioPortalId } from '../../commerce/store/studioProductRepository'
import type { Product } from '../../commerce/types/product'

// Selling a bundle (Portal migration 0041) on its page: which of its
// Workspaces this member already bought, and what they'd pay for the rest.

export interface BundlePurchaseInfo {
  // Product ids ("studio-…") of the included Workspaces already bought.
  ownedIds: string[]
  // What this member pays now, in cents (0 when they own everything).
  amountDueCents: number
  ownsAll: boolean
}

export async function loadBundlePurchaseInfo(
  bundle: Product,
  items: Product[],
  userId: string | undefined,
): Promise<BundlePurchaseInfo> {
  const bundleCents = cents(bundle.basePrice)
  if (!userId) return { ownedIds: [], amountDueCents: bundleCents, ownsAll: false }

  const licenses = await studioWorkspaceService.listLicenses(userId)
  // Bought = a live purchase. A trial or access given by the team doesn't count.
  const owned = new Set(
    items
      .filter((item) => {
        const license = licenses.find((l) => l.product_id === studioPortalId(item.id)) ?? null
        return deriveAccessState(license, false) === 'purchased'
      })
      .map((item) => item.id),
  )
  const amountDueCents = bundleAmountDueCents(
    bundleCents,
    items.map((item) => ({ priceCents: cents(item.basePrice), owned: owned.has(item.id) })),
  )
  return { ownedIds: [...owned], amountDueCents, ownsAll: items.length > 0 && owned.size === items.length }
}

// Paid → Stripe Checkout URL; free (or nothing left to pay) → My Workspaces.
export function startBundleCheckout(slug: string) {
  return postStudioCheckout({ bundleSlug: slug })
}
