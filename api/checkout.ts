import type { VercelRequest, VercelResponse } from '@vercel/node'
import { orderService } from '../src/modules/commerce/server/orderService'
import { paymentManager } from '../src/modules/commerce/server/paymentManager'
import type { Cart } from '../src/modules/commerce/types/purchase'
import type { PaymentProfileId } from '../src/modules/commerce/types/paymentProfile'

interface CheckoutRequestBody {
  paymentProfileId: PaymentProfileId
  cart: Cart
  memberId: string
  successUrl?: string
  cancelUrl?: string
  region?: string
}

// The one server-side entry point CommerceEngineClient's paymentManager
// calls (see CommerceEngineClient.ts) — the real PaymentManager +
// StripeProvider (secret keys included) live here, never in the browser.
// See ARCHITECTURE.md's "Payment completion pipeline":
//
//   Frontend -> CommerceEngine (client) -> /api/checkout -> Stripe Checkout
//
// Creates the Order first (via OrderService, backed by
// SupabaseOrderRepository — the shared store /api/webhooks/stripe.ts
// later completes it through) and only then starts the Stripe Checkout
// Session, reusing Cart.id as the correlation key StripeProvider sets as
// client_reference_id — no CheckoutSessionRequest field changes needed.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = req.body as CheckoutRequestBody
  if (!body?.paymentProfileId || !body?.cart || !body?.memberId) {
    res.status(400).json({ error: 'paymentProfileId, cart, and memberId are required' })
    return
  }

  try {
    const order = await orderService.createOrder(body.cart, body.memberId)
    const providerCart: Cart = { ...body.cart, id: order.id }

    const result = await paymentManager.createCheckout(
      body.paymentProfileId,
      {
        cart: providerCart,
        memberId: body.memberId,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
      },
      body.region,
    )

    res.status(200).json({ ...result, orderId: order.id })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to start checkout' })
  }
}
