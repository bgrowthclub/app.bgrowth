import type { Product, ProductIndex } from '../types/product'

// The seam between "where Product records come from" and everything that
// queries them (ProductService, below). Index-first by design: the Runtime
// is expected to load the lightweight ProductIndex up front, decide what it
// actually needs from it, and only then load individual products' full
// bodies — never fetch every product just to filter or search.
//
// Today the only implementation (mock/mockProducts.ts's
// createLocalProductRepository) derives both methods from the local mock
// array — there is no real "index vs. full body" cost difference yet. Once
// BGrowth Studio publishes real product data, a RemoteProductRepository
// implementing this same interface — built on a RemoteProductSource (see
// RemoteProductSource.ts) — replaces it:
//
//   Remote Product Source (GitHub, S3, Supabase Storage, an API, ...)
//           ↓
//   RemoteProductRepository: loadIndex() -> source.fetchJson('manifest.json')
//                             loadProduct(id) -> source.fetchJson(`products/${id}.json`)
//           ↓
//   ProductService (unchanged)
//
// ProductService and every caller of it stay exactly the same either way —
// only the object passed into createProductService changes.
//
// Read-only by design: app.bgrowth is the Runtime, not Studio. This
// interface has no save/publish/archive method and never will — those are
// Studio's concern, in Studio's own repo.
export interface ProductRepository {
  // The manifest step — fetched once, up front. Enough to filter, search,
  // and list products without loading any of their full bodies.
  loadIndex(): Promise<ProductIndex>

  // Loads one product's full body, only once a caller has decided (from
  // the index) that it actually needs it.
  loadProduct(id: string): Promise<Product | undefined>
}
