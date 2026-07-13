import type { ProviderId } from './provider'

// The provider-agnostic shape a payment provider's raw webhook payload is
// normalized into. WebhookService.handleWebhookEvent() is the only place
// that ever reads a provider's raw payload — everything else in Commerce
// (OrderService, RefundService, ...) reacts to this shape instead, so no
// caller needs to know whether the event came from Stripe, PayPal, Wix
// Payments, or any future provider.

export type WebhookEventType =
  | 'checkout.completed'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'refund.completed'
  | 'subscription.cancelled'

export interface WebhookEvent {
  id: string
  provider: ProviderId
  type: WebhookEventType
  transactionId?: string
  orderId?: string
  receivedAt: string // ISO date string
  raw: unknown // the provider's original payload, kept for audit/debugging only
}
