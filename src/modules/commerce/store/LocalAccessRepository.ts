import type { ProductAccess } from '../types/access'
import type { AccessRepository } from '../services/AccessRepository'
import { getMockProductAccess } from '../mock/mockProductAccess'

// The browser's AccessRepository while the Website has no real backend —
// an in-memory store seeded from getMockProductAccess() (the mock grants
// resolved through ProductCatalogService), exactly like
// store/LocalOrderRepository.ts is for Order records. client/accessService.ts
// builds on this until the Website connects to the shared Supabase project
// (Website Consolidation plan, step 3), at which point it switches to
// HttpAccessRepository.ts and nothing above AccessService changes.
export function createLocalAccessRepository(): AccessRepository {
  return {
    async saveAccess(record) {
      const access = await getMockProductAccess()
      const index = access.findIndex((a) => a.memberId === record.memberId && a.productId === record.productId)
      if (index >= 0) {
        access[index] = record
      } else {
        access.push(record)
      }
      return record
    },

    async getAccess(memberId, productId) {
      const access = await getMockProductAccess()
      return access.find((a) => a.memberId === memberId && a.productId === productId)
    },

    async listAccessForMember(memberId) {
      const access = await getMockProductAccess()
      return access.filter((a) => a.memberId === memberId)
    },
  }
}
