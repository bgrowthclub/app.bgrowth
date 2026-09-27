import type { ProductAccess } from '../types/access'
import type { AccessRepository } from '../services/AccessRepository'

// The browser's AccessRepository implementation — reads through the
// server-side /api/access endpoint instead of Supabase directly, since
// the browser must never hold SUPABASE_SERVICE_ROLE_KEY (or any other
// server-only credential). AccessService.ts only constructs this when
// running in the browser (see its isServer check) — the exact same
// repository-swap pattern used everywhere else in Commerce (e.g.
// ProductRepository's local vs. published implementations); AccessService
// itself, and every caller of it (Product Library, Dashboard sections,
// ...), never changes.
//
// Never writes: access is only ever granted server-side, from a
// completed Order (see OrderService.ts / ARCHITECTURE.md's "Payment
// completion pipeline") — the browser must never grant access directly,
// extending the same invariant that already applies to PaymentProvider.
export function createHttpAccessRepository(): AccessRepository {
  async function listAccessForMember(memberId: string): Promise<ProductAccess[]> {
    const response = await fetch(`/api/access?memberId=${encodeURIComponent(memberId)}`)
    if (!response.ok) throw new Error(`Failed to load access for member "${memberId}"`)
    const data = (await response.json()) as { access: ProductAccess[] }
    return data.access
  }

  return {
    async saveAccess() {
      throw new Error(
        'Access can only be granted server-side, by OrderService.completeOrder — the browser must never grant access directly.',
      )
    },

    listAccessForMember,

    async getAccess(memberId, productId) {
      const list = await listAccessForMember(memberId)
      return list.find((a) => a.productId === productId)
    },
  }
}
