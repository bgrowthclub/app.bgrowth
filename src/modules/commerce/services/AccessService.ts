import type { ProductAccess } from '../types/access'
import { getMockProductAccess } from '../mock/mockProductAccess'

// Deliberately not a PurchaseService — access and payment are separate
// concerns (see types/access.ts's AccessSource: purchase is only one of
// several ways a member can have access). Every caller that needs to know
// "can this member use this product" — the Product Library, the Product
// Engine, a future gated Runtime page — reads through this, never through
// mock/mockProductAccess.ts or a Purchase record directly. The UI should
// never need to know *why* access exists, only whether it does.
export interface AccessService {
  hasAccess(memberId: string, productId: string): Promise<boolean>
  getAccess(memberId: string, productId: string): Promise<ProductAccess | undefined>
  listAccessForMember(memberId: string): Promise<ProductAccess[]>
  grantAccess(access: ProductAccess): Promise<ProductAccess>
}

// The one concrete AccessService implementation today — an in-memory query
// (and, for grantAccess, mutation) over the array getMockProductAccess()
// resolves and caches. A future real implementation swaps the backing store
// for a database; this interface doesn't change.
export function createAccessService(): AccessService {
  return {
    async hasAccess(memberId, productId) {
      const store = await getMockProductAccess()
      return store.some((a) => a.memberId === memberId && a.productId === productId && a.hasAccess)
    },

    async getAccess(memberId, productId) {
      const store = await getMockProductAccess()
      return store.find((a) => a.memberId === memberId && a.productId === productId)
    },

    async listAccessForMember(memberId) {
      const store = await getMockProductAccess()
      return store.filter((a) => a.memberId === memberId)
    },

    async grantAccess(access) {
      const store = await getMockProductAccess()
      const existingIndex = store.findIndex(
        (a) => a.memberId === access.memberId && a.productId === access.productId,
      )
      if (existingIndex >= 0) {
        store[existingIndex] = access
      } else {
        store.push(access)
      }
      return access
    },
  }
}

export const accessService: AccessService = createAccessService()
