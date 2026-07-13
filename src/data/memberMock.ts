// Placeholder member state for the Workspace — there is no real
// session/account/purchase history yet (see CLAUDE.md: never add real auth
// or persistence without explicit direction). Centralized here so every
// Workspace surface (and the legacy /my-systems page) reads the same mock
// ownership list instead of each hardcoding its own copy.

export const MOCK_MEMBER_NAME = 'Jordan Casey'
export const MOCK_MEMBERSHIP_TIER = 'Free Plan'

// One mock purchase record per Workspace this mock member owns — the
// "Purchase Database" step of the target architecture (Stripe Payment →
// Webhook → Purchase Database → User Library → Open Workspace) doesn't
// exist yet, so this stands in for it. lib/workspaceLibrary.ts is the only
// place that reads this array directly; every UI surface reads through its
// getPurchasedWorkspaces() accessor instead.
export interface MockPurchaseRecord {
  slug: string
  purchasedOn: string // ISO date string
  lastOpenedAt?: string // ISO date string — omitted if never opened
}

export const MOCK_PURCHASES: MockPurchaseRecord[] = [
  { slug: 'start-your-notary-business', purchasedOn: '2026-05-12T00:00:00.000Z', lastOpenedAt: '2026-07-10T00:00:00.000Z' },
  { slug: 'daily-notary-operations', purchasedOn: '2026-06-02T00:00:00.000Z' },
]

// Slugs of Workspaces this mock member "owns" — derived from MOCK_PURCHASES
// so there is exactly one list to keep in sync. The first entry also stands
// in for "most recently opened" below.
export const PURCHASED_SLUGS = MOCK_PURCHASES.map((p) => p.slug)

export const LAST_OPENED_SLUG = PURCHASED_SLUGS[0]
