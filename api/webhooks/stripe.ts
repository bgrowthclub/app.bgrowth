import type { VercelRequest, VercelResponse } from '@vercel/node'
import { stripeProvider } from '../../src/modules/commerce/services/providers/StripeProvider'
import { orderService } from '../../src/modules/commerce/services/OrderService'

// Stripe signature verification needs the exact raw request body — never
// Vercel's auto-parsed JSON object — so the default body parser is
// disabled here (see StripeProvider.webhook / PaymentProvider.ts).
export const config = {
  api: {
    bodyParser: false,
  },
}

function readRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

// The webhook endpoint from ARCHITECTURE.md's "Payment completion
// pipeline":
//
//   Stripe Webhook -> /api/webhooks/stripe -> OrderService.completeOrder
//
// This handler does exactly two things: verify + normalize the event
// (via StripeProvider.webhook, never parsing Stripe's payload itself),
// then call OrderService.completeOrder and nothing else — it never
// touches AccessService or either repository directly (see
// WebhookService.ts's doc comment on this exact invariant). completeOrder
// is idempotent, so a Stripe retry (at-least-once delivery) is always
// safe to re-process.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const signature = req.headers['stripe-signature']
  if (typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' })
    return
  }

  const rawBody = await readRawBody(req)

  let event
  try {
    event = await stripeProvider.webhook(rawBody, signature)
  } catch (err) {
    res.status(400).json({ error: `Webhook signature verification failed: ${err instanceof Error ? err.message : err}` })
    return
  }

  if (event.type === 'checkout.completed') {
    if (!event.orderId || !event.transactionId) {
      res.status(400).json({ error: 'Webhook event missing orderId or transactionId' })
      return
    }
    try {
      await orderService.completeOrder(event.orderId, event.transactionId)
    } catch (err) {
      // Non-2xx makes Stripe retry — safe, since completeOrder is idempotent.
      res.status(500).json({ error: `Failed to complete order: ${err instanceof Error ? err.message : err}` })
      return
    }
  }

  res.status(200).json({ received: true })
}
