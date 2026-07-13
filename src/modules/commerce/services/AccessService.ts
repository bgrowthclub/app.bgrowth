import type { ProductAccess } from '../types/access'
import { MOCK_PRODUCT_ACCESS } from '../mock/mockProductAccess'

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
// (and, for grantAccess, mutation) over MOCK_PRODUCT_ACCESS. A future real
// implementation swaps the backing store for a database; this interface
// doesn't change.
export function createAccessService(): AccessService {
  return {
    async hasAccess(memberId, productId) {
      return MOCK_PRODUCT_ACCESS.some(
        (a) => a.memberId === memberId && a.productId === productId && a.hasAccess,
      )
    },

    async getAccess(memberId, productId) {
      return MOCK_PRODUCT_ACCESS.find((a) => a.memberId === memberId && a.productId === productId)
    },

    async listAccessForMember(memberId) {
      return MOCK_PRODUCT_ACCESS.filter((a) => a.memberId === memberId)
    },

    async grantAccess(access) {
      const existingIndex = MOCK_PRODUCT_ACCESS.findIndex(
        (a) => a.memberId === access.memberId && a.productId === access.productId,
      )
      if (existingIndex >= 0) {
        MOCK_PRODUCT_ACCESS[existingIndex] = access
      } else {
        MOCK_PRODUCT_ACCESS.push(access)
      }
      return access
    },
  }
}

export const accessService: AccessService = createAccessService()
