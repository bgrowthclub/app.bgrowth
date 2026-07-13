import type { OrderService } from './services/OrderService'
import type { PricingService } from './services/PricingService'
import type { CouponService } from './services/CouponService'
import type { TaxService } from './services/TaxService'
import type { PaymentProvider } from './services/PaymentProvider'
import type { RefundService } from './services/RefundService'
import type { WebhookService } from './services/WebhookService'

// BGrowth Commerce Engine — the single commercial layer the rest of the
// application (Checkout page, Studio, Workspace) is ever allowed to call
// for anything payment-shaped:
//
//   Website -> Commerce Engine -> Payment Provider -> Payment Gateway
//
// The Commerce Engine composes the six services below and is responsible
// for selecting the active PaymentProvider (Stripe, PayPal, Wix Payments,
// Square, Mercado Pago, or any future provider) and routing every
// checkout/refund/webhook call through it. No page or component ever
// selects or calls a PaymentProvider directly, and nothing outside
// Commerce ever imports a provider SDK — see CLAUDE.md §16 and
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

  getActivePaymentProvider(): PaymentProvider
}
