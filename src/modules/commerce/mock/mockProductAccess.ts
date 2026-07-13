import type { ProductAccess } from '../types/access'

// Mirrors mock/mockPurchases.ts's MOCK_PURCHASES — this is the access grant
// that purchase resulted in, kept as its own record because access can
// exist without a purchase at all (membership, gift, coupon, ...). See
// services/AccessService.ts, which is what everything should read this
// through rather than this array directly.
export const MOCK_PRODUCT_ACCESS: ProductAccess[] = [
  {
    productId: 'prod-001',
    memberId: 'member-mock-1',
    hasAccess: true,
    source: 'purchase',
    grantedAt: '2026-06-01T00:00:00.000Z',
  },
]
