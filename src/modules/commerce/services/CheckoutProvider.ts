import type { CheckoutSessionRequest, CheckoutSessionResult, ProviderId } from '../types/provider'

// The single entry point the rest of the application ever calls to begin
// a purchase. It never talks to Stripe/PayPal/etc. directly — a concrete
// implementation of this interface picks and delegates to whichever
// ProviderAdapter is active, based on configuration this milestone does
// not define. Swapping the active provider (or adding a new one) means
// writing a new ProviderAdapter, never touching application code that
// calls CheckoutProvider. See ARCHITECTURE.md.
//
// Interface only — no implementation.
export interface CheckoutProvider {
  startCheckout(request: CheckoutSessionRequest): Promise<CheckoutSessionResult>
  getActiveProvider(): ProviderId
}
