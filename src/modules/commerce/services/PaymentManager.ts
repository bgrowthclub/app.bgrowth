import type { PaymentProfile, PaymentProfileId } from '../types/paymentProfile'
import type { PaymentProvider } from './PaymentProvider'
import type { ProviderId, CheckoutSessionRequest, CheckoutSessionResult } from '../types/provider'
import type { Transaction } from '../types/purchase'
import { getMockPaymentProfile } from '../mock/mockPaymentProfiles'
import { stripeProvider } from './providers/StripeProvider'

// The seam between CommerceEngine and PaymentProvider:
//
//   Checkout -> Commerce Engine -> Payment Manager -> Payment Provider
//
// PaymentManager is the only thing that ever decides WHICH PaymentProvider
// handles a given payment — by resolving a product's PaymentProfileId
// (and, for a 'regional' profile, the buyer's region) to a concrete
// provider. Checkout and Product Pages never make or see this decision;
// they only ever carry a PaymentProfileId, never a provider name (see
// types/paymentProfile.ts). CommerceEngine calls this instead of holding
// a single active PaymentProvider itself, which is what makes adding a
// country or a provider a data change here, never a Checkout/Product Page
// change.
export interface PaymentManager {
  resolvePaymentProfile(paymentProfileId: PaymentProfileId): Promise<PaymentProfile>
  resolveProvider(paymentProfileId: PaymentProfileId, region?: string): Promise<PaymentProvider>

  createCheckout(
    paymentProfileId: PaymentProfileId,
    request: CheckoutSessionRequest,
    region?: string,
  ): Promise<CheckoutSessionResult>
  verifyPayment(paymentProfileId: PaymentProfileId, transactionId: string): Promise<Transaction>
  refund(paymentProfileId: PaymentProfileId, transactionId: string): Promise<Transaction>
  cancel(paymentProfileId: PaymentProfileId, transactionId: string): Promise<Transaction>
}

// Every registered PaymentProvider, keyed by ProviderId — Stripe is the
// only entry today. Adding a second provider is exactly one new entry
// here, never a change to PaymentManager's logic below, CommerceEngine,
// or Checkout — see ARCHITECTURE.md's "Future Stripe integration".
const PROVIDERS: Partial<Record<ProviderId, PaymentProvider>> = {
  stripe: stripeProvider,
}

// The one concrete PaymentManager implementation today. Server-only — it
// resolves real PaymentProvider instances (StripeProvider reads secret
// keys), so this must only ever be constructed/called from /api/*.ts, not
// from a page or component. See CommerceEngineClient.ts for the browser's
// side of this seam, which calls /api/checkout instead of this directly.
export function createPaymentManager(): PaymentManager {
  async function resolvePaymentProfile(paymentProfileId: PaymentProfileId): Promise<PaymentProfile> {
    const profile = getMockPaymentProfile(paymentProfileId)
    if (!profile) throw new Error(`Unknown PaymentProfileId "${paymentProfileId}"`)
    return profile
  }

  async function resolveProvider(paymentProfileId: PaymentProfileId, region?: string): Promise<PaymentProvider> {
    const profile = await resolvePaymentProfile(paymentProfileId)
    const providerId = (region && profile.regionOverrides?.[region]) || profile.providerId
    const provider = PROVIDERS[providerId]
    if (!provider) throw new Error(`No PaymentProvider registered for provider id "${providerId}"`)
    return provider
  }

  return {
    resolvePaymentProfile,
    resolveProvider,

    async createCheckout(paymentProfileId, request, region) {
      const provider = await resolveProvider(paymentProfileId, region)
      return provider.createCheckout(request)
    },

    async verifyPayment(paymentProfileId, transactionId) {
      const provider = await resolveProvider(paymentProfileId)
      return provider.verifyPayment(transactionId)
    },

    async refund(paymentProfileId, transactionId) {
      const provider = await resolveProvider(paymentProfileId)
      return provider.refund(transactionId)
    },

    async cancel(paymentProfileId, transactionId) {
      const provider = await resolveProvider(paymentProfileId)
      return provider.cancel(transactionId)
    },
  }
}

export const paymentManager: PaymentManager = createPaymentManager()
