import type { Cart, Purchase, Order, Transaction, Invoice } from '../types/purchase'

// One coherent example flow — a cart, the order it became, the purchase(s)
// it granted, the transaction that paid for it, and the resulting
// invoice — to illustrate how the models fit together end to end.

export const MOCK_CART: Cart = {
  id: 'cart-001',
  items: [{ productId: 'prod-001', quantity: 1, unitPrice: { amount: 79, currency: 'USD' } }],
  currency: 'USD',
}

export const MOCK_ORDER: Order = {
  id: 'order-001',
  memberId: 'member-mock-1',
  items: MOCK_CART.items,
  purchases: ['purchase-001'],
  subtotal: { amount: 79, currency: 'USD' },
  discountTotal: { amount: 0, currency: 'USD' },
  taxTotal: { amount: 0, currency: 'USD' },
  total: { amount: 79, currency: 'USD' },
  status: 'completed',
  createdAt: '2026-06-01T00:00:00.000Z',
}

export const MOCK_PURCHASES: Purchase[] = [
  {
    id: 'purchase-001',
    productId: 'prod-001',
    memberId: 'member-mock-1',
    type: 'one-time',
    status: 'completed',
    quantity: 1,
    createdAt: '2026-06-01T00:00:00.000Z',
    providerRef: { provider: 'stripe', providerTransactionId: 'txn-mock-001' },
  },
]

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'transaction-001',
    orderId: 'order-001',
    provider: 'stripe',
    providerTransactionId: 'txn-mock-001',
    amount: { amount: 79, currency: 'USD' },
    status: 'captured',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
]

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'invoice-001',
    orderId: 'order-001',
    memberId: 'member-mock-1',
    lineItems: MOCK_CART.items,
    subtotal: { amount: 79, currency: 'USD' },
    taxTotal: { amount: 0, currency: 'USD' },
    total: { amount: 79, currency: 'USD' },
    issuedAt: '2026-06-01T00:00:00.000Z',
  },
]

export function getMockPurchasesForMember(memberId: string) {
  return MOCK_PURCHASES.filter((p) => p.memberId === memberId)
}
