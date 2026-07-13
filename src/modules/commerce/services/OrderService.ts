import type { Order, Cart } from '../types/purchase'

// Interface only — no implementation. Owns the whole-cart checkout record
// (Order) as distinct from PurchaseService, which owns the per-product
// entitlement record (Purchase) an Order resolves into once completed.
// CommerceEngine is the only caller; nothing else in the application
// creates or reads an Order directly.
export interface OrderService {
  createOrder(cart: Cart, memberId: string): Promise<Order>
  getOrderById(orderId: string): Promise<Order | undefined>
  listOrdersForMember(memberId: string): Promise<Order[]>
  completeOrder(orderId: string, transactionId: string): Promise<Order>
  cancelOrder(orderId: string): Promise<Order>
}
