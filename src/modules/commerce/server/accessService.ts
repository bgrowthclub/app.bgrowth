import type { AccessService } from '../services/AccessService'
import { createAccessService } from '../services/AccessService'
import { createSupabaseAccessRepository } from '../store/SupabaseAccessRepository'

// The real, server-only AccessService singleton — Supabase-backed, the
// shared source of truth OrderService.completeOrder writes into (see
// server/orderService.ts). Only /api/*.ts imports this. The browser's
// equivalent is client/accessService.ts (HTTP-backed, reads through
// /api/access) — it must never hold SUPABASE_SERVICE_ROLE_KEY. See
// ARCHITECTURE.md's "Server/client boundary" section.
export const accessService: AccessService = createAccessService(createSupabaseAccessRepository())
