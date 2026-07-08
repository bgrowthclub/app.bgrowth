import type { ProviderId, CheckoutSessionRequest, CheckoutSessionResult } from '../types/provider'
import type { Transaction } from '../types/purchase'

// The seam every payment provider integration implements — Stripe, PayPal,
// Mercado Pago, Apple Pay, Google Pay, Hotmart, Paddle, Lemon Squeezy, or
// any future provider. Nothing in this application or the rest of Commerce
// imports a provider SDK directly; everything calls something implementing
// this interface instead, selected by CheckoutProvider. See
// ARCHITECTURE.md's Commerce Architecture section for the full flow.
//
// Interface only — no implementation. No concrete Stripe/PayPal adapter
// exists yet; this milestone is the contract they'll be built against.
export interface ProviderAdapter {
  readonly id: ProviderId
  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResult>
  refundTransaction(transactionId: string): Promise<Transaction>
  getTransaction(transactionId: string): Promise<Transaction>
}
