import type { Product } from './product'

// A frozen point-in-time copy of everything a Product looked like at the
// moment it was published — see ProductAdminService.publish(). `Omit`
// (not a hand-written copy) so this can never drift out of sync with
// Product's real shape; excluding `versioning` itself is what keeps the
// type from being infinitely self-referential.
export type ProductSnapshot = Omit<Product, 'versioning'>

export interface ProductVersion {
  version: number
  publishedAt: string
  snapshot: ProductSnapshot
}

// Draft/Published separation: `draftVersion` counts how many times the
// working copy has been saved since it was created (or since it was last
// published); `publishedVersion` points at whichever entry in `history` is
// currently live. Publishing never overwrites a prior version in place —
// it appends a new entry to `history` and moves the pointer, so nothing
// already published is ever silently lost.
export interface ProductVersioning {
  draftVersion: number
  publishedVersion?: number
  history: ProductVersion[]
}

export function createInitialVersioning(): ProductVersioning {
  return { draftVersion: 1, history: [] }
}
