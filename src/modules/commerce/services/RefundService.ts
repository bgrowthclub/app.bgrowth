import type { Purchase, Transaction } from '../types/purchase'

// Interface only — no implementation. Owns the refund workflow across an
// Order/Purchase/Transaction, calling into PaymentManager (which resolves
// the right PaymentProvider.refund() for the order's Payment Profile)
// rather than a provider SDK or a specific PaymentProvider directly.
// Distinct from PurchaseService.refundPurchase (which only flips a
// Purchase's status) — this is the orchestration layer CommerceEngine
// exposes, which itself coordinates PurchaseService and PaymentManager
// together.
export interface RefundService {
  refundTransaction(transactionId: string): Promise<Transaction>
  refundPurchase(purchaseId: string): Promise<Purchase>
  getRefundStatus(transactionId: string): Promise<Transaction['status']>
}
