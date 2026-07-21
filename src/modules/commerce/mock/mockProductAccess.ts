import type { ProductAccess } from '../types/access'
import { productCatalogService } from '../services/ProductCatalogService'
import { MOCK_USER } from '../../identity/mock/mockUser'

// Mirrors data/memberMock.ts's MOCK_PURCHASES for the same mock member —
// this is the access grant that purchase resulted in, kept as its own
// record because access can exist without a purchase at all (membership,
// gift, coupon, ...). See services/AccessService.ts, which is what
// everything should read this through rather than this array directly.
// Keyed by Product id (Commerce's identity), resolved by slug here rather
// than hardcoded, so this never drifts from whichever id the Product
// Catalog actually assigned that entry (see data/products/staticProducts.ts).
// `memberId` reads MOCK_USER.id directly rather than a second hardcoded
// literal — a mismatch here previously left every access grant silently
// unmatchable against the real mock user (see lib/productLibrary.ts).
async function grantFor(slug: string, grantedAt: string): Promise<ProductAccess[]> {
  const product = await productCatalogService.getBySlug(slug)
  if (!product) return []
  return [{ productId: product.id, memberId: MOCK_USER.id, hasAccess: true, source: 'purchase', grantedAt }]
}

async function loadMockProductAccess(): Promise<ProductAccess[]> {
  return [
    ...(await grantFor('start-your-notary-business', '2026-05-12T00:00:00.000Z')),
    ...(await grantFor('daily-notary-operations', '2026-06-02T00:00:00.000Z')),
  ]
}

// productCatalogService.getBySlug is async (unlike the old mockProducts.ts
// lookup), so this can no longer be a synchronously-available array —
// callers await this once; the resolved array is cached so every caller
// shares the same reference, which is what lets AccessService.grantAccess
// mutate it in place and have that mutation visible on the next call.
let cachedAccess: Promise<ProductAccess[]> | undefined

export function getMockProductAccess(): Promise<ProductAccess[]> {
  if (!cachedAccess) {
    cachedAccess = loadMockProductAccess()
  }
  return cachedAccess
}
