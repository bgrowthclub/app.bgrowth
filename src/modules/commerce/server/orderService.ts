import type { OrderService } from '../services/OrderService'
import { createOrderService } from '../services/OrderService'
import { createSupabaseOrderRepository } from '../store/SupabaseOrderRepository'
import { accessService } from './accessService'

// The real, server-only OrderService singleton — Supabase-backed. Used by
// /api/checkout.ts (creates an Order) and /api/webhooks/stripe.ts
// (completes one). Nothing in the browser creates or completes an Order
// in this flow, so there is no client/orderService.ts counterpart — see
// ARCHITECTURE.md's "Server/client boundary" section.
export const orderService: OrderService = createOrderService(createSupabaseOrderRepository(), accessService)
