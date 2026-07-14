import type { ProductAccess } from '../types/access'
import type { AccessRepository } from './AccessRepository'
import { createLocalAccessRepository } from '../store/LocalAccessRepository'

// Deliberately not a PurchaseService — access and payment are separate
// concerns (see types/access.ts's AccessSource: purchase is only one of
// several ways a member can have access). Every caller that needs to know
// "can this member use this product" — the Product Library, the Product
// Engine, a future gated Runtime page — reads through this, never through
// AccessRepository or a Purchase record directly. The UI should never
// need to know *why* access exists, only whether it does.
//
// `grantAccess` is called by OrderService.completeOrder once a webhook
// confirms payment — see OrderService.ts and ARCHITECTURE.md's "Payment
// completion pipeline". Nothing else should call it directly, and a
// PaymentProvider/webhook handler must never call it itself: Order
// completion is the only thing that grants `purchase`-sourced access.
export interface AccessService {
  hasAccess(memberId: string, productId: string): Promise<boolean>
  getAccess(memberId: string, productId: string): Promise<ProductAccess | undefined>
  listAccessForMember(memberId: string): Promise<ProductAccess[]>
  grantAccess(access: ProductAccess): Promise<ProductAccess>
}

// The one concrete AccessService implementation today — delegates every
// read/write to whichever AccessRepository it's given (see
// AccessRepository.ts), exactly like ProductService delegates to a
// ProductRepository. AccessService itself never touches a mock array or
// any other storage detail directly.
export function createAccessService(repository: AccessRepository): AccessService {
  return {
    async hasAccess(memberId, productId) {
      const access = await repository.getAccess(memberId, productId)
      return access?.hasAccess ?? false
    },

    async getAccess(memberId, productId) {
      return repository.getAccess(memberId, productId)
    },

    async listAccessForMember(memberId) {
      return repository.listAccessForMember(memberId)
    },

    async grantAccess(access) {
      return repository.saveAccess(access)
    },
  }
}

export const accessService: AccessService = createAccessService(createLocalAccessRepository())
