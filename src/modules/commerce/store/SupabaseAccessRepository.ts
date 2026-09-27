import { createClient } from '@supabase/supabase-js'
import type { ProductAccess } from '../types/access'
import type { AccessRepository } from '../services/AccessRepository'

// The Supabase-backed AccessRepository implementation — mirrors
// SupabaseOrderRepository's role and reasoning exactly. AccessService
// itself never changes; only which repository it's built on does.
//
// Server-only: reads SUPABASE_SERVICE_ROLE_KEY. AccessService.ts only
// constructs this behind an isServer check — the browser reads access
// through HttpAccessRepository (/api/access) instead, never Supabase
// directly.
interface AccessRow {
  member_id: string
  product_id: string
  has_access: boolean
  source: ProductAccess['source']
  granted_at: string
  expires_at: string | null
}

function toRow(access: ProductAccess): AccessRow {
  return {
    member_id: access.memberId,
    product_id: access.productId,
    has_access: access.hasAccess,
    source: access.source,
    granted_at: access.grantedAt,
    expires_at: access.expiresAt ?? null,
  }
}

function fromRow(row: AccessRow): ProductAccess {
  return {
    memberId: row.member_id,
    productId: row.product_id,
    hasAccess: row.has_access,
    source: row.source,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at ?? undefined,
  }
}

export function createSupabaseAccessRepository(): AccessRepository {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use SupabaseAccessRepository')
  }
  const supabase = createClient(url, serviceRoleKey)

  return {
    async saveAccess(access) {
      const { error } = await supabase
        .from('product_access')
        .upsert(toRow(access), { onConflict: 'member_id,product_id' })
      if (error) {
        throw new Error(`Failed to save access for member "${access.memberId}" / product "${access.productId}": ${error.message}`)
      }
      return access
    },

    async getAccess(memberId, productId) {
      const { data, error } = await supabase
        .from('product_access')
        .select('*')
        .eq('member_id', memberId)
        .eq('product_id', productId)
        .maybeSingle()
      if (error) throw new Error(`Failed to load access for member "${memberId}" / product "${productId}": ${error.message}`)
      return data ? fromRow(data as AccessRow) : undefined
    },

    async listAccessForMember(memberId) {
      const { data, error } = await supabase.from('product_access').select('*').eq('member_id', memberId)
      if (error) throw new Error(`Failed to list access for member "${memberId}": ${error.message}`)
      return (data ?? []).map((row) => fromRow(row as AccessRow))
    },
  }
}
