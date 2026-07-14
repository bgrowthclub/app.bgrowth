import type { Order, Cart } from '../types/purchase'
import type { Money } from '../types/pricing'
import type { OrderRepository } from './OrderRepository'
import type { AccessService } from './AccessService'
import { createLocalOrderRepository } from '../store/LocalOrderRepository'
import { createSupabaseOrderRepository } from '../store/SupabaseOrderRepository'
import { accessService } from './AccessService'

// Owns the whole-cart checkout record (Order) as distinct from
// PurchaseService, which owns the per-product entitlement record
// (Purchase) an Order resolves into once completed. CommerceEngine is the
// only caller; nothing else in the application creates or reads an Order
// directly.
//
// `completeOrder` is the payment completion pipeline's one orchestration
// point — see ARCHITECTURE.md's "Payment completion pipeline":
//
//   Stripe Webhook -> WebhookService -> OrderService.completeOrder
//     -> OrderRepository.saveOrder
//     -> AccessService.grantAccess -> AccessRepository.saveAccess
//
// A webhook handler (once a real PaymentProvider exists) calls this and
// only this — it must never call AccessService itself. Access is always
// granted as a side effect of an Order completing here, never any other
// way for a `purchase`-sourced grant.
export interface OrderService {
  createOrder(cart: Cart, memberId: string): Promise<Order>
  getOrderById(orderId: string): Promise<Order | undefined>
  listOrdersForMember(memberId: string): Promise<Order[]>
  completeOrder(orderId: string, transactionId: string): Promise<Order>
  cancelOrder(orderId: string): Promise<Order>
}

let orderCounter = 0

// The one concrete OrderService implementation today, built the same way
// ProductService is — createOrderService(repository: OrderRepository) —
// so OrderService itself never knows how an Order is persisted, only ever
// calling whichever OrderRepository it's given. Also takes an
// AccessService, since completeOrder's job is exactly "an Order completed,
// now grant access for what was bought" — not persistence, so it isn't
// threaded through OrderRepository.
export function createOrderService(repository: OrderRepository, access: AccessService): OrderService {
  // Idempotency for completeOrder — see the doc comment there. Keyed by
  // orderId: while a completion is in flight, a concurrent duplicate call
  // (e.g. a webhook retry arriving before the first delivery's handler
  // returned) awaits the exact same in-progress result instead of
  // re-running the completion logic a second time.
  const inFlightCompletions = new Map<string, Promise<Order>>()

  return {
    // Coupon/tax calculation isn't implemented yet (CouponService,
    // TaxService are still interface-only — see ARCHITECTURE.md), so
    // discountTotal/taxTotal are always zero here; subtotal === total
    // until those are wired in. Not a design decision — a known
    // limitation of this milestone.
    async createOrder(cart, memberId) {
      orderCounter += 1
      const subtotalAmount = cart.items.reduce((sum, item) => sum + item.unitPrice.amount * item.quantity, 0)
      const subtotal: Money = { amount: subtotalAmount, currency: cart.currency }
      const zero: Money = { amount: 0, currency: cart.currency }
      const order: Order = {
        id: `order-${Date.now()}-${orderCounter}`,
        memberId,
        items: cart.items,
        purchases: [],
        subtotal,
        discountTotal: zero,
        taxTotal: zero,
        total: subtotal,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      return repository.saveOrder(order)
    },

    async getOrderById(orderId) {
      return repository.getOrderById(orderId)
    },

    async listOrdersForMember(memberId) {
      return repository.listOrdersForMember(memberId)
    },

    // The only place a completed payment turns into granted access. Loads
    // the Order, marks it completed, saves it — then grants `purchase`
    // access for every item it contained. A webhook handler calls this
    // with the Order id and the confirming transaction id; it never
    // grants access itself.
    //
    // Idempotent by design, because a real payment provider's webhooks
    // are delivered at-least-once, not exactly-once — Stripe (and every
    // other provider) retries a webhook it didn't get a 200 for, so this
    // method WILL be called more than once for the same transaction in
    // normal operation, not just as an edge case:
    //
    //   - Sequential duplicate (the common case: a retry arrives after
    //     the first delivery already completed the order) — the
    //     already-completed check below returns the existing Order
    //     unchanged. It does not re-save the Order, and does not call
    //     AccessService again, so `grantedAt` is never re-stamped and no
    //     duplicate ProductAccess record is ever produced.
    //   - Concurrent duplicate (a retry arrives while the first delivery
    //     is still being processed) — `inFlightCompletions` makes the
    //     second caller await the exact same in-flight Promise instead of
    //     re-reading the still-'pending' Order and double-processing it.
    //   - A transactionId that doesn't match what already completed this
    //     order is treated as a genuine anomaly (never a normal retry —
    //     a provider never re-sends a *different* transaction id for an
    //     order it already completed) and throws rather than silently
    //     overwriting the original transactionId or granting access
    //     again.
    //
    // This never creates an Order — a webhook can only ever complete one
    // that `createOrder` already made at checkout time; an unknown
    // `orderId` throws instead of being created here, so a duplicate (or
    // malformed) webhook delivery can never fabricate a new Order either.
    //
    // This closes the race within this one process/mock only. A real
    // OrderRepository (replacing LocalOrderRepository) running behind
    // multiple server instances must additionally enforce this at the
    // persistence layer (e.g. a conditional update / unique constraint on
    // transactionId) — see ARCHITECTURE.md's "Payment completion pipeline
    // idempotency" note.
    async completeOrder(orderId, transactionId) {
      const inFlight = inFlightCompletions.get(orderId)
      if (inFlight) return inFlight

      const completion = (async () => {
        try {
          const order = await repository.getOrderById(orderId)
          if (!order) throw new Error(`Order "${orderId}" not found`)

          if (order.status === 'completed') {
            if (order.transactionId !== transactionId) {
              throw new Error(
                `Order "${orderId}" was already completed by transaction "${order.transactionId}" — refusing to complete it again with transaction "${transactionId}"`,
              )
            }
            return order
          }

          const completed: Order = { ...order, status: 'completed', transactionId }
          await repository.saveOrder(completed)

          const grantedAt = new Date().toISOString()
          await Promise.all(
            completed.items.map((item) =>
              access.grantAccess({
                productId: item.productId,
                memberId: completed.memberId,
                hasAccess: true,
                source: 'purchase',
                grantedAt,
              }),
            ),
          )

          return completed
        } finally {
          inFlightCompletions.delete(orderId)
        }
      })()

      inFlightCompletions.set(orderId, completion)
      return completion
    },

    async cancelOrder(orderId) {
      const order = await repository.getOrderById(orderId)
      if (!order) throw new Error(`Order "${orderId}" not found`)
      const cancelled: Order = { ...order, status: 'cancelled' }
      return repository.saveOrder(cancelled)
    },
  }
}

// Server (Node, e.g. /api/checkout.ts and /api/webhooks/stripe.ts) gets
// the real Supabase-backed repository — the shared source of truth those
// two separate serverless functions both need (see ARCHITECTURE.md's
// "Payment completion pipeline"). Nothing in the browser creates or
// completes an Order directly in this flow, so the browser side keeps
// LocalOrderRepository as an inert fallback — safe, since it's never
// exercised there.
const isServer = typeof window === 'undefined'
export const orderService: OrderService = createOrderService(
  isServer ? createSupabaseOrderRepository() : createLocalOrderRepository(),
  accessService,
)
