import type { Order, Cart } from '../types/purchase'
import type { Money } from '../types/pricing'
import type { OrderRepository } from './OrderRepository'
import type { AccessService } from './AccessService'
import { createLocalOrderRepository } from '../store/LocalOrderRepository'
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
    async completeOrder(orderId, transactionId) {
      const order = await repository.getOrderById(orderId)
      if (!order) throw new Error(`Order "${orderId}" not found`)

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
    },

    async cancelOrder(orderId) {
      const order = await repository.getOrderById(orderId)
      if (!order) throw new Error(`Order "${orderId}" not found`)
      const cancelled: Order = { ...order, status: 'cancelled' }
      return repository.saveOrder(cancelled)
    },
  }
}

export const orderService: OrderService = createOrderService(createLocalOrderRepository(), accessService)
