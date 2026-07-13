import type { Order } from '../types/purchase'
import type { OrderRepository } from '../services/OrderRepository'

// The only OrderRepository implementation today — an in-memory array,
// exactly like store/publishedProductStore.ts is for products. No
// database, Google Sheets, or any other real persistence is wired up
// here, and no OrderService implementation is built on top of it yet
// (see OrderRepository.ts) — this milestone prepares the repository
// abstraction only, so a real implementation can replace this one later
// without OrderService or CommerceEngine ever changing.
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
