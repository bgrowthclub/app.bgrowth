import type { PaymentProfile, PaymentProfileId } from '../types/paymentProfile'
import type { PaymentProvider } from './PaymentProvider'
import type { CheckoutSessionRequest, CheckoutSessionResult } from '../types/provider'
import type { Transaction } from '../types/purchase'

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
//
// Interface only — no implementation. No provider selection logic exists
// yet; this is the seam a future implementation resolves through, and the
// seam the first PaymentProvider (Stripe) will be registered against.
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
