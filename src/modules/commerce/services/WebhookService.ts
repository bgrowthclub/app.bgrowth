import type { WebhookEvent } from '../types/webhook'
import type { ProviderId } from '../types/provider'

// Interface only — no implementation. The single place an inbound payment
// provider webhook is verified and normalized into a provider-agnostic
// WebhookEvent, before anything else in the Commerce Engine (OrderService,
// RefundService, ...) reacts to it. Nothing outside this service ever
// parses a provider's raw webhook payload directly.
export interface WebhookService {
  verifyWebhookSignature(provider: ProviderId, payload: unknown, signature: string): Promise<boolean>
  handleWebhookEvent(provider: ProviderId, payload: unknown): Promise<WebhookEvent>
}
