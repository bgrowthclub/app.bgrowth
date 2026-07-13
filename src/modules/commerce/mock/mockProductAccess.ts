import type { ProductAccess } from '../types/access'
import { getMockProductBySlug } from './mockProducts'
import { MOCK_USER } from '../../identity/mock/mockUser'

// Mirrors data/memberMock.ts's MOCK_PURCHASES for the same mock member —
// this is the access grant that purchase resulted in, kept as its own
// record because access can exist without a purchase at all (membership,
// gift, coupon, ...). See services/AccessService.ts, which is what
// everything should read this through rather than this array directly.
// Keyed by Product id (Commerce's identity), resolved by slug here rather
// than hardcoded, so this never drifts from whichever id mockProducts.ts
// actually assigned that BusinessSystem's generated Product wrapper.
// `memberId` reads MOCK_USER.id directly rather than a second hardcoded
// literal — a mismatch here previously left every access grant silently
// unmatchable against the real mock user (see lib/productLibrary.ts).
function grantFor(slug: string, grantedAt: string): ProductAccess[] {
  const product = getMockProductBySlug(slug)
  if (!product) return []
  return [{ productId: product.id, memberId: MOCK_USER.id, hasAccess: true, source: 'purchase', grantedAt }]
}

export const MOCK_PRODUCT_ACCESS: ProductAccess[] = [
  ...grantFor('start-your-notary-business', '2026-05-12T00:00:00.000Z'),
  ...grantFor('daily-notary-operations', '2026-06-02T00:00:00.000Z'),
]
