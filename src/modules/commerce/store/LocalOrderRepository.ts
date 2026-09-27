import type { Order } from '../types/purchase'
import type { OrderRepository } from '../services/OrderRepository'

// Superseded by SupabaseOrderRepository.ts (see server/orderService.ts,
// the only place OrderService's real singleton is now built). Left in
// place, unused, per CLAUDE.md §12/§18 — recommend removal once approved.
//
// An in-memory array, exactly like store/publishedProductStore.ts is for
// products. No database, Google Sheets, or any other real persistence is
// wired up here.
export function createLocalOrderRepository(): OrderRepository {
  let orders: Order[] = []

  return {
    async saveOrder(order) {
      const index = orders.findIndex((o) => o.id === order.id)
      orders = index >= 0 ? [...orders.slice(0, index), order, ...orders.slice(index + 1)] : [...orders, order]
      return order
    },

    async getOrderById(orderId) {
      return orders.find((o) => o.id === orderId)
    },

    async listOrdersForMember(memberId) {
      return orders.filter((o) => o.memberId === memberId)
    },
  }
}
