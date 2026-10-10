// What a member pays for a bundle (Portal migration 0041). Someone who
// already bought some of its Workspaces pays only for the rest: the bundle
// price shrinks in proportion to the separate prices of the Workspaces
// they don't own yet (by count when every Workspace is free).
//
// api/studio-checkout.ts charges with this same rule (copied there — the
// serverless functions can't import from src/). Change both together.

export interface BundleItemPrice {
  priceCents: number
  owned: boolean
}

// Stripe's smallest card charge in USD.
export const MIN_CHARGE_CENTS = 50

export function bundleAmountDueCents(bundleCents: number, items: BundleItemPrice[]): number {
  const missing = items.filter((i) => !i.owned)
  if (items.length === 0 || missing.length === 0) return 0
  if (missing.length === items.length) return bundleCents
  const total = items.reduce((sum, i) => sum + Math.max(0, i.priceCents), 0)
  const share =
    total > 0 ? missing.reduce((sum, i) => sum + Math.max(0, i.priceCents), 0) / total : missing.length / items.length
  const due = Math.round(bundleCents * share)
  return due > 0 ? Math.max(due, MIN_CHARGE_CENTS) : 0
}

// The Workspaces' separate prices added up — the bundle's "compare at".
export function separatePriceCents(items: { priceCents: number }[]): number {
  return items.reduce((sum, i) => sum + Math.max(0, i.priceCents), 0)
}

// Whole percent saved against buying each Workspace on its own.
export function savingsPercent(bundleCents: number, separateCents: number): number {
  if (separateCents <= 0 || bundleCents >= separateCents) return 0
  return Math.round((1 - bundleCents / separateCents) * 100)
}

// "$49" / "$12.50" — the same style as the Workspace cards.
export function formatCents(cents: number): string {
  const amount = cents / 100
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

export const toCents = (price: number) => Math.round(price * 100)
