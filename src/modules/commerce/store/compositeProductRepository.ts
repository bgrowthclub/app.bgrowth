import type { ProductRepository } from '../services/ProductRepository'
import type { ProductIndexEntry } from '../types/product'

// Several product sources behind one ProductRepository, in priority order
// (earlier sources list first). A source that fails to load — e.g. the
// Portal's database is unreachable — is skipped rather than taking the
// whole catalog down with it.
export function createCompositeProductRepository(sources: ProductRepository[]): ProductRepository {
  return {
    async loadIndex() {
      const indexes = await Promise.all(sources.map((s) => s.loadIndex().catch(() => undefined)))
      const seenSlugs = new Set<string>()
      const products: ProductIndexEntry[] = []
      for (const index of indexes) {
        for (const entry of index?.products ?? []) {
          // First source wins on a slug clash, so a real product is never
          // shadowed by an example with the same slug.
          if (seenSlugs.has(entry.slug)) continue
          seenSlugs.add(entry.slug)
          products.push(entry)
        }
      }
      return { generatedAt: new Date().toISOString(), products }
    },

    async loadProduct(id) {
      for (const source of sources) {
        const product = await source.loadProduct(id).catch(() => undefined)
        if (product) return product
      }
      return undefined
    },
  }
}
