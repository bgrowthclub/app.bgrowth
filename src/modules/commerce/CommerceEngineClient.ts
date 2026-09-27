import type { CommerceEngine } from './CommerceEngine'
import type { PaymentManager } from './services/PaymentManager'
import type { CheckoutSessionResult } from './types/provider'

// The browser's face of the Commerce Engine. CheckoutPage communicates
// only with this — never with a PaymentProvider, PaymentManager's server
// implementation, or Stripe directly (see CLAUDE.md §16). Only
// `paymentManager.createCheckout` does real work here: it posts to
// /api/checkout, the Vercel serverless function holding the real
// PaymentManager + StripeProvider (secret keys included) — see
// ARCHITECTURE.md's "Payment completion pipeline". Every other
// CommerceEngine member isn't needed by any browser flow today and
// throws if actually called, exactly like every other still-unimplemented
// Commerce service elsewhere in the app — this object exists to satisfy
// CheckoutPage's dependency on the CommerceEngine interface, not to fully
// implement every service behind it.
function notAvailableInBrowser(name: string): never {
  throw new Error(`${name} is not available in the browser — it requires server-side credentials.`)
}

// Throws a clear error for any method call on a Commerce service this
// milestone's Checkout flow doesn't need (orders, pricing, coupons, tax,
// refunds, webhooks). Satisfies the full service interface at compile
// time via the `as T` cast, without writing a manual stub for every
// method of every one of those services.
function unavailableInBrowser<T extends object>(serviceName: string): T {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        return () => notAvailableInBrowser(`${serviceName}.${String(prop)}`)
      },
    },
  ) as T
}

const paymentManagerClient: PaymentManager = {
  async resolvePaymentProfile() {
    return notAvailableInBrowser('PaymentManager.resolvePaymentProfile')
  },

  async resolveProvider() {
    return notAvailableInBrowser('PaymentManager.resolveProvider')
  },

  async createCheckout(paymentProfileId, request, region) {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        paymentProfileId,
        cart: request.cart,
        memberId: request.memberId,
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        region,
      }),
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(body.error ?? `Checkout failed with status ${response.status}`)
    }
    return (await response.json()) as CheckoutSessionResult
  },

  async verifyPayment() {
    return notAvailableInBrowser('PaymentManager.verifyPayment')
  },

  async refund() {
    return notAvailableInBrowser('PaymentManager.refund')
  },

  async cancel() {
    return notAvailableInBrowser('PaymentManager.cancel')
  },
}

export const commerceEngine: CommerceEngine = {
  orders: unavailableInBrowser('CommerceEngine.orders'),
  pricing: unavailableInBrowser('CommerceEngine.pricing'),
  coupons: unavailableInBrowser('CommerceEngine.coupons'),
  tax: unavailableInBrowser('CommerceEngine.tax'),
  refunds: unavailableInBrowser('CommerceEngine.refunds'),
  webhooks: unavailableInBrowser('CommerceEngine.webhooks'),
  paymentManager: paymentManagerClient,
}
