import Stripe from 'stripe'
import type { PaymentProvider } from '../PaymentProvider'
import type { Transaction } from '../../types/purchase'
import type { WebhookEvent, WebhookEventType } from '../../types/webhook'

// The first (and today, only) concrete PaymentProvider implementation —
// see ARCHITECTURE.md's "Future Stripe integration" for the plan this
// follows, and "Payment completion pipeline" for how webhook() feeds
// OrderService.completeOrder. This is the ONLY file allowed to import the
// Stripe SDK (see CLAUDE.md §16) — nothing else in the application talks
// to Stripe directly.
//
// Server-only: reads STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET, which
// must never reach the client bundle. Only imported from /api/*.ts (via
// PaymentManager) — never from a page or component.
//
// Uses Stripe Checkout (a hosted, redirect-based page) — createCheckout
// returns Stripe's own checkoutUrl, so this app never embeds Stripe.js /
// Stripe Elements or touches card data directly. That's also why
// VITE_STRIPE_PUBLISHABLE_KEY (see .env.example) isn't used by this
// milestone's flow — it's prepared for a future embedded/Elements-based
// checkout, not required for a redirect-based one.
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY must be set to use StripeProvider')
  return new Stripe(secretKey)
}

function toMoney(amount: number | null, currency: string): Transaction['amount'] {
  return { amount: (amount ?? 0) / 100, currency: currency.toUpperCase() as Transaction['amount']['currency'] }
}

function toTransactionStatus(status: Stripe.PaymentIntent.Status): Transaction['status'] {
  switch (status) {
    case 'succeeded':
      return 'captured'
    case 'canceled':
      return 'failed'
    case 'requires_payment_method':
    case 'requires_action':
      return 'failed'
    default:
      return 'authorized'
  }
}

function paymentIntentToTransaction(intent: Stripe.PaymentIntent): Transaction {
  const orderId = intent.metadata?.orderId ?? ''
  return {
    id: intent.id,
    orderId,
    provider: 'stripe',
    providerTransactionId: intent.id,
    amount: toMoney(intent.amount, intent.currency),
    status: toTransactionStatus(intent.status),
    createdAt: new Date(intent.created * 1000).toISOString(),
  }
}

// Maps the one Stripe event type this milestone's flow actually needs
// (checkout.session.completed, which OrderService.completeOrder is
// driven by) plus the other event types WebhookEventType already
// reserves. Unhandled/unexpected event types throw — the webhook endpoint
// should only be configured (in the Stripe Dashboard) to send event types
// this mapping covers; anything else arriving is treated as a
// configuration error, not silently ignored.
function mapStripeEventType(stripeType: string): WebhookEventType {
  switch (stripeType) {
    case 'checkout.session.completed':
      return 'checkout.completed'
    case 'payment_intent.succeeded':
      return 'payment.succeeded'
    case 'payment_intent.payment_failed':
      return 'payment.failed'
    case 'charge.refunded':
      return 'refund.completed'
    case 'customer.subscription.deleted':
      return 'subscription.cancelled'
    default:
      throw new Error(`Unhandled Stripe event type "${stripeType}" — configure the webhook endpoint to only send handled event types`)
  }
}

export const stripeProvider: PaymentProvider = {
  id: 'stripe',

  async createCheckout(request) {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // The correlation key the webhook reads back out (see webhook()
      // below and OrderService.completeOrder) — set to the Order id by
      // the caller (see /api/checkout.ts), reusing Cart.id's slot rather
      // than adding a new field to CheckoutSessionRequest.
      client_reference_id: request.cart.id,
      payment_intent_data: { metadata: { orderId: request.cart.id } },
      line_items: request.cart.items.map((item) => ({
        price_data: {
          currency: request.cart.currency.toLowerCase(),
          product_data: { name: item.productId },
          unit_amount: Math.round(item.unitPrice.amount * 100),
        },
        quantity: item.quantity,
      })),
      success_url: request.successUrl ?? 'https://bgrowth.com/checkout/success',
      cancel_url: request.cancelUrl ?? 'https://bgrowth.com/checkout',
    })

    if (!session.url) throw new Error('Stripe did not return a Checkout Session URL')

    return { provider: 'stripe', checkoutUrl: session.url, sessionId: session.id }
  },

  async verifyPayment(transactionId) {
    const stripe = getStripeClient()
    const intent = await stripe.paymentIntents.retrieve(transactionId)
    return paymentIntentToTransaction(intent)
  },

  async refund(transactionId) {
    const stripe = getStripeClient()
    await stripe.refunds.create({ payment_intent: transactionId })
    const intent = await stripe.paymentIntents.retrieve(transactionId)
    return { ...paymentIntentToTransaction(intent), status: 'refunded' }
  },

  async webhook(payload, signature) {
    const stripe = getStripeClient()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET must be set to use StripeProvider.webhook')

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    const type = mapStripeEventType(event.type)

    let orderId: string | undefined
    let transactionId: string | undefined

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      orderId = session.client_reference_id ?? undefined
      transactionId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
    } else if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent
      orderId = intent.metadata?.orderId
      transactionId = intent.id
    }

    const webhookEvent: WebhookEvent = {
      id: event.id,
      provider: 'stripe',
      type,
      transactionId,
      orderId,
      receivedAt: new Date().toISOString(),
      raw: event,
    }
    return webhookEvent
  },

  async cancel(transactionId) {
    const stripe = getStripeClient()
    const intent = await stripe.paymentIntents.cancel(transactionId)
    return paymentIntentToTransaction(intent)
  },
}
