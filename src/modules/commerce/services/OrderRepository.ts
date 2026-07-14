import type { Order } from '../types/purchase'

// The seam between "where Order records are stored" and OrderService,
// which owns the business logic of creating/completing/cancelling an
// Order but never how that record is actually persisted — mirrors
// ProductRepository.ts's role for Product records. OrderService is built
// the same way ProductService is — createOrderService(repository:
// OrderRepository): OrderService (see server/orderService.ts, the only
// place the real singleton is constructed) — so OrderService itself never
// knows how an Order is persisted; it only ever calls whichever
// repository it's given.
//
// SupabaseOrderRepository (store/SupabaseOrderRepository.ts) is the real
// implementation today. LocalOrderRepository (store/LocalOrderRepository.ts)
// is superseded and unused — left in place per CLAUDE.md §12/§18. A
// future database- or API-backed OrderRepository can still replace
// SupabaseOrderRepository the same way — nothing above this layer
// (OrderService, CommerceEngine, or any page) ever changes when that
// happens.
export interface OrderRepository {
  saveOrder(order: Order): Promise<Order>
  getOrderById(orderId: string): Promise<Order | undefined>
  listOrdersForMember(memberId: string): Promise<Order[]>
}
