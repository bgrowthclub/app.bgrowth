import type { WebhookEvent } from '../types/webhook'
import type { ProviderId } from '../types/provider'

// Interface only — no implementation. The single place an inbound payment
// provider webhook is verified and normalized into a provider-agnostic
// WebhookEvent, before anything else in the Commerce Engine (OrderService,
// RefundService, ...) reacts to it. Nothing outside this service ever
// parses a provider's raw webhook payload directly.
//
// `payload` is always the exact raw, unparsed request body (never a
// parsed/re-serialized object) — signature verification needs the exact
// bytes the provider signed. A future implementation resolves `provider`
// to a PaymentProvider (via PaymentManager) and delegates to its
// `webhook(payload, signature)`, which verifies and parses atomically —
// see PaymentProvider.ts.
//
// The rest of the payment completion pipeline is already implemented —
// see ARCHITECTURE.md's "Payment completion pipeline". Once
// `handleWebhookEvent` can produce a real WebhookEvent, its implementation
// must, for a `checkout.completed` or `payment.succeeded` event, call
// `orderService.completeOrder(event.orderId, event.transactionId)` and
// nothing else — that single call is what saves the Order and grants
// access. This service must never call AccessService (or OrderRepository/
// AccessRepository) itself; OrderService is the only orchestration point
// after payment confirmation, and Stripe (or any provider) never grants
// access directly.
export interface WebhookService {
  verifyWebhookSignature(provider: ProviderId, payload: string, signature: string): Promise<boolean>
  handleWebhookEvent(provider: ProviderId, payload: string, signature: string): Promise<WebhookEvent>
}
