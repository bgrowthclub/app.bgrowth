import type { Order, Cart } from '../types/purchase'

// Interface only — no implementation. Owns the whole-cart checkout record
// (Order) as distinct from PurchaseService, which owns the per-product
// entitlement record (Purchase) an Order resolves into once completed.
// CommerceEngine is the only caller; nothing else in the application
// creates or reads an Order directly.
//
// A future implementation is built the same way ProductService is today —
// createOrderService(repository: OrderRepository): OrderService (see
// OrderRepository.ts / store/LocalOrderRepository.ts) — so OrderService
// itself never knows how an Order is actually persisted; it only ever
// calls whichever OrderRepository it's given.
export interface OrderService {
  createOrder(cart: Cart, memberId: string): Promise<Order>
  getOrderById(orderId: string): Promise<Order | undefined>
  listOrdersForMember(memberId: string): Promise<Order[]>
  completeOrder(orderId: string, transactionId: string): Promise<Order>
  cancelOrder(orderId: string): Promise<Order>
}
