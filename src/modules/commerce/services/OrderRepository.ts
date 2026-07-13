import type { Order } from '../types/purchase'

// The seam between "where Order records are stored" and OrderService,
// which owns the business logic of creating/completing/cancelling an
// Order but never how that record is actually persisted — mirrors
// ProductRepository.ts's role for Product records. A future OrderService
// implementation is built the same way ProductService is today —
// createOrderService(repository: OrderRepository): OrderService — so
// OrderService itself never knows how an Order is persisted; it only
// ever calls whichever repository it's given.
//
// LocalOrderRepository (store/LocalOrderRepository.ts) is the only
// implementation today, backed by an in-memory array. A future database-
// or API-backed OrderRepository (e.g. Postgres, Google Sheets, or
// anything else) implements this exact same interface and replaces it —
// nothing above this layer (OrderService, CommerceEngine, or any page)
// ever changes when that happens.
export interface OrderRepository {
  saveOrder(order: Order): Promise<Order>
  getOrderById(orderId: string): Promise<Order | undefined>
  listOrdersForMember(memberId: string): Promise<Order[]>
}
