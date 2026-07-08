import type { Money, CurrencyCode } from './pricing'
import type { ProviderTransactionRef } from './provider'

export type PurchaseType = 'one-time' | 'subscription' | 'bundle' | 'gift' | 'upgrade'

export type PurchaseStatus = 'pending' | 'completed' | 'refunded' | 'cancelled' | 'failed'

export interface CartItem {
  productId: string
  quantity: number
  unitPrice: Money
  discountId?: string // a Discount or Coupon id applied to this line item — see benefits.ts
}

export interface Cart {
  id: string
  items: CartItem[]
  currency: CurrencyCode
  couponCode?: string
}

// A single purchase record — the thing that ultimately grants
// ProductAccess (see access.ts). `memberId` is an opaque reference to a
// future member/account identity; no auth model exists yet (see CLAUDE.md).
export interface Purchase {
  id: string
  productId: string
  memberId: string
  type: PurchaseType
  status: PurchaseStatus
  quantity: number
  giftRecipientId?: string // set when type === 'gift'
  couponId?: string
  createdAt: string // ISO date string
  providerRef?: ProviderTransactionRef
}

// A checkout's full record — one or more CartItems, resolved into one or
// more Purchases once completed.
export interface Order {
  id: string
  memberId: string
  items: CartItem[]
  purchases: string[] // Purchase ids created from this order
  subtotal: Money
  discountTotal: Money
  taxTotal: Money
  total: Money
  status: PurchaseStatus
  createdAt: string
}

// The actual payment event behind an Order, as reported by whichever
// ProviderAdapter processed it (see services/ProviderAdapter.ts).
export interface Transaction {
  id: string
  orderId: string
  provider: ProviderTransactionRef['provider']
  providerTransactionId: string
  amount: Money
  status: 'authorized' | 'captured' | 'refunded' | 'failed'
  createdAt: string
}

export interface Invoice {
  id: string
  orderId: string
  memberId: string
  lineItems: CartItem[]
  subtotal: Money
  taxTotal: Money
  total: Money
  issuedAt: string
  pdfUrl?: string
}
