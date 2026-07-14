import type { ProductAccess } from '../types/access'
import type { AccessRepository } from '../services/AccessRepository'
import { MOCK_PRODUCT_ACCESS } from '../mock/mockProductAccess'

// Superseded by SupabaseAccessRepository.ts (server) / HttpAccessRepository.ts
// (browser) — AccessService.ts no longer constructs this. Left in place,
// unused, per CLAUDE.md §12/§18 — recommend removal once approved.
//
// An in-memory array seeded from MOCK_PRODUCT_ACCESS (standing in for
// grants that already existed before this session), exactly like
// store/LocalOrderRepository.ts is for Order records. No database or
// other real persistence is wired up here.
export function createLocalAccessRepository(): AccessRepository {
  let access: ProductAccess[] = [...MOCK_PRODUCT_ACCESS]

  return {
    async saveAccess(record) {
      const index = access.findIndex((a) => a.memberId === record.memberId && a.productId === record.productId)
      access = index >= 0 ? [...access.slice(0, index), record, ...access.slice(index + 1)] : [...access, record]
      return record
    },

    async getAccess(memberId, productId) {
      return access.find((a) => a.memberId === memberId && a.productId === productId)
    },

    async listAccessForMember(memberId) {
      return access.filter((a) => a.memberId === memberId)
    },
  }
}
