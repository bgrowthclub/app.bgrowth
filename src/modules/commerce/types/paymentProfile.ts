import type { ProviderId } from './provider'

// Named "modes" of payment behavior a Product can be sold under. A Product
// references a PaymentProfileId (see types/product.ts) — it never
// references a payment provider (Stripe, PayPal, ...) directly.
// PaymentManager (see services/PaymentManager.ts) is the only thing that
// resolves a PaymentProfileId to a concrete PaymentProvider, optionally
// varying by the buyer's region — see `regionOverrides` below. This is
// what lets BGrowth sell in the United States, Brazil, Europe, Canada,
// Asia, and Australia without Checkout or a Product Page ever changing:
// they only ever know a product's PaymentProfileId.
export type KnownPaymentProfileId = 'standard' | 'membership' | 'free' | 'enterprise' | 'regional'

// The `(string & {})` escape hatch means a not-yet-listed profile doesn't
// require a type change, matching the same pattern ProviderId already
// uses in types/provider.ts.
export type PaymentProfileId = KnownPaymentProfileId | (string & {})

export interface PaymentProfile {
  id: PaymentProfileId
  label: string
  description?: string
  // The provider this profile routes to by default.
  providerId: ProviderId
  // Country/region codes (e.g. "US", "BR", "EU", "CA", "AU") mapped to a
  // different provider for that region — how a 'regional' profile can
  // route the same product to different providers per region without
  // Checkout or the Product Page ever knowing. No entries are populated
  // yet — no provider exists to route to.
  regionOverrides?: Record<string, ProviderId>
}
