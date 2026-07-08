import type { Purchase, PurchaseType } from '../types/purchase'

export interface CreatePurchaseInput {
  productId: string
  memberId: string
  type: PurchaseType
  couponId?: string
  giftRecipientId?: string
}

// Interface only — no implementation. This is the seam Workspace's
// ownership surfaces (My Business Systems, Continue Building) would
// eventually read through instead of data/memberMock.ts's hardcoded
// PURCHASED_SLUGS — see ARCHITECTURE.md's Commerce section.
export interface PurchaseService {
  createPurchase(input: CreatePurchaseInput): Promise<Purchase>
  getPurchaseById(id: string): Promise<Purchase | undefined>
  listPurchasesForMember(memberId: string): Promise<Purchase[]>
  refundPurchase(purchaseId: string): Promise<Purchase>
}
