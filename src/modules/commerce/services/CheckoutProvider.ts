import type { CheckoutSessionRequest, CheckoutSessionResult, ProviderId } from '../types/provider'

// Superseded by CommerceEngine (see ../CommerceEngine.ts), which now owns
// selecting the active PaymentProvider and routing checkout/refund/webhook
// calls through it. Left in place, unused, per CLAUDE.md §12/§18 —
// recommend removal once every caller has migrated to CommerceEngine.
//
// The single entry point the rest of the application ever calls to begin
// a purchase. It never talks to Stripe/PayPal/etc. directly — a concrete
// implementation of this interface picks and delegates to whichever
// PaymentProvider is active, based on configuration this milestone does
// not define. See ARCHITECTURE.md's Commerce Engine section.
//
// Interface only — no implementation.
export interface CheckoutProvider {
  startCheckout(request: CheckoutSessionRequest): Promise<CheckoutSessionResult>
  getActiveProvider(): ProviderId
}
