import type { ProviderId, CheckoutSessionRequest, CheckoutSessionResult } from '../types/provider'
import type { Transaction } from '../types/purchase'
import type { WebhookEvent } from '../types/webhook'

// The seam every payment provider integration implements — Stripe, PayPal,
// Wix Payments, Square, Mercado Pago, or any future provider. This is the
// Commerce Engine's renamed, expanded replacement for ProviderAdapter.ts
// (left in place, unused, per CLAUDE.md §12/§18 — recommend removal once
// approved). PaymentManager (see ./PaymentManager.ts) is the only thing
// that ever selects and calls a PaymentProvider — not CommerceEngine
// directly, and never a page or component. Nothing else in the
// application imports a provider SDK, or this interface, directly. See
// ARCHITECTURE.md's Commerce Engine section for the full
// Checkout → Commerce Engine → Payment Manager → Payment Provider → Payment Gateway flow.
//
// Interface only — no implementation. No concrete Stripe/PayPal/etc.
// adapter exists yet; this is the contract the first one will be built
// against.
export interface PaymentProvider {
  readonly id: ProviderId

  createCheckout(request: CheckoutSessionRequest): Promise<CheckoutSessionResult>
  verifyPayment(transactionId: string): Promise<Transaction>
  refund(transactionId: string): Promise<Transaction>
  // `payload` is the exact raw, unparsed request body — every real
  // provider's signature scheme (e.g. Stripe's HMAC over the raw bytes)
  // verifies and parses in one atomic step, and breaks if handed a
  // re-serialized or already-parsed object instead of the original
  // string. `signature` is whatever header/value that provider's scheme
  // requires (e.g. Stripe's `stripe-signature` header).
  webhook(payload: string, signature: string): Promise<WebhookEvent>
  cancel(transactionId: string): Promise<Transaction>
}
