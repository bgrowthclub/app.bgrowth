import type { OrderService } from './services/OrderService'
import type { PricingService } from './services/PricingService'
import type { CouponService } from './services/CouponService'
import type { TaxService } from './services/TaxService'
import type { PaymentManager } from './services/PaymentManager'
import type { RefundService } from './services/RefundService'
import type { WebhookService } from './services/WebhookService'

// BGrowth Commerce Engine — the single commercial layer the rest of the
// application (Checkout page, Studio, Workspace) is ever allowed to call
// for anything payment-shaped:
//
//   Checkout -> Commerce Engine -> Payment Manager -> Payment Provider -> Payment Gateway
//
// The Commerce Engine composes the six services below. It never selects a
// PaymentProvider itself, and never knows which country or currency a
// buyer is in — that decision belongs entirely to PaymentManager (see
// services/PaymentManager.ts), which resolves a product's PaymentProfile
// to a concrete provider. This is what lets BGrowth sell in any region
// (United States, Brazil, Europe, Canada, Asia, Australia, ...) without a
// single change to Checkout or a Product Page — they only ever carry a
// PaymentProfileId, never a provider name or a hardcoded currency. Nothing
// outside Commerce ever imports a provider SDK — see CLAUDE.md §16 and
// ARCHITECTURE.md's Commerce Engine section.
//
// Interface only — no implementation. This is the architecture a future
// sprint's first concrete PaymentProvider implementation will be wired
// into; no payment logic exists yet.
export interface CommerceEngine {
  readonly orders: OrderService
  readonly pricing: PricingService
  readonly coupons: CouponService
  readonly tax: TaxService
  readonly refunds: RefundService
  readonly webhooks: WebhookService
  readonly paymentManager: PaymentManager
}
