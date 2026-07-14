import type { ProductAccess } from '../types/access'

// The seam between "where ProductAccess records are stored" and
// AccessService, which owns the business logic of "does this member have
// access" but never how that record is actually persisted — mirrors
// OrderRepository's role for Order records (see OrderRepository.ts). Two
// implementations today, selected by AccessService.ts's isServer check:
// SupabaseAccessRepository.ts (server — the real, shared store) and
// HttpAccessRepository.ts (browser — reads through /api/access, since the
// browser must never hold SUPABASE_SERVICE_ROLE_KEY). LocalAccessRepository.ts
// is superseded by SupabaseAccessRepository.ts and no longer used by
// anything — left in place, unused, per CLAUDE.md §12/§18's
// no-silent-deletion policy.
export interface AccessRepository {
  saveAccess(access: ProductAccess): Promise<ProductAccess>
  getAccess(memberId: string, productId: string): Promise<ProductAccess | undefined>
  listAccessForMember(memberId: string): Promise<ProductAccess[]>
}
