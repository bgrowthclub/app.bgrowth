import { createClient } from '@supabase/supabase-js'
import type { Order } from '../types/purchase'
import type { OrderRepository } from '../services/OrderRepository'

// The Supabase-backed OrderRepository implementation — the shared
// persistence layer /api/checkout.ts and /api/webhooks/stripe.ts both
// read and write through, since those run as separate Vercel serverless
// functions with no shared in-memory state (see ARCHITECTURE.md's
// "Payment completion pipeline"). Implements the exact same
// OrderRepository interface LocalOrderRepository does — OrderService
// itself never changes; only which repository createOrderService is
// built on does. Scoped narrowly per this milestone: only Orders and
// Access move to Supabase — Products, Product Packages, Builders, and
// Workspaces stay exactly as they are.
//
// Server-only: reads SUPABASE_SERVICE_ROLE_KEY, which must never reach
// the client bundle (see .env.example). OrderService.ts only constructs
// this behind an isServer check — never import/call this from browser
// code directly.
interface OrderRow {
  id: string
  member_id: string
  items: Order['items']
  purchases: Order['purchases']
  subtotal: Order['subtotal']
  discount_total: Order['discountTotal']
  tax_total: Order['taxTotal']
  total: Order['total']
  status: Order['status']
  created_at: string
  transaction_id: string | null
}

function toRow(order: Order): OrderRow {
  return {
    id: order.id,
    member_id: order.memberId,
    items: order.items,
    purchases: order.purchases,
    subtotal: order.subtotal,
    discount_total: order.discountTotal,
    tax_total: order.taxTotal,
    total: order.total,
    status: order.status,
    created_at: order.createdAt,
    transaction_id: order.transactionId ?? null,
  }
}

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    memberId: row.member_id,
    items: row.items,
    purchases: row.purchases,
    subtotal: row.subtotal,
    discountTotal: row.discount_total,
    taxTotal: row.tax_total,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    transactionId: row.transaction_id ?? undefined,
  }
}

export function createSupabaseOrderRepository(): OrderRepository {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use SupabaseOrderRepository')
  }
  const supabase = createClient(url, serviceRoleKey)

  return {
    async saveOrder(order) {
      const { error } = await supabase.from('orders').upsert(toRow(order))
      if (error) throw new Error(`Failed to save order "${order.id}": ${error.message}`)
      return order
    },

    async getOrderById(orderId) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
      if (error) throw new Error(`Failed to load order "${orderId}": ${error.message}`)
      return data ? fromRow(data as OrderRow) : undefined
    },

    async listOrdersForMember(memberId) {
      const { data, error } = await supabase.from('orders').select('*').eq('member_id', memberId)
      if (error) throw new Error(`Failed to list orders for member "${memberId}": ${error.message}`)
      return (data ?? []).map((row) => fromRow(row as OrderRow))
    },
  }
}
