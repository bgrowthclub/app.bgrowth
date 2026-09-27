import type { PaymentProfile, PaymentProfileId } from '../types/paymentProfile'

// The current payment routing configuration — which PaymentProfile routes
// to which PaymentProvider. Stands in for a future Studio-managed source
// the same way mock/mockProducts.ts stands in for a real catalog export;
// every profile below routes to 'stripe' today since it's the only
// PaymentProvider implemented (see services/providers/StripeProvider.ts).
// A 'regional' profile's regionOverrides is where a second provider
// (Mercado Pago for Brazil, for example) would be introduced later —
// without PaymentManager, CommerceEngine, or Checkout ever changing.
export const MOCK_PAYMENT_PROFILES: Record<string, PaymentProfile> = {
  standard: { id: 'standard', label: 'Standard', providerId: 'stripe' },
  membership: { id: 'membership', label: 'Membership', providerId: 'stripe' },
  free: { id: 'free', label: 'Free', providerId: 'stripe' },
  enterprise: { id: 'enterprise', label: 'Enterprise', providerId: 'stripe' },
  regional: { id: 'regional', label: 'Regional', providerId: 'stripe', regionOverrides: {} },
}

export function getMockPaymentProfile(id: PaymentProfileId): PaymentProfile | undefined {
  return MOCK_PAYMENT_PROFILES[id]
}
