import type { Product } from '../types/product'

// The seam between "where Product records come from" and everything that
// queries them (ProductService, below). Today the only implementation
// (mock/mockProducts.ts's createLocalProductRepository) reads a local mock
// array. Once BGrowth Studio publishes real Product JSON — this repo's
// target pipeline is Studio → GitHub/Product Repository → app.bgrowth reads
// Product JSON → renders product pages — a RemoteProductRepository fetching
// that JSON replaces it here. ProductService and every caller of it stay
// unchanged; only the object passed into createProductService changes.
//
// Read-only by design: app.bgrowth is the Runtime, not Studio. This
// interface has no save/publish/archive method and never will — those are
// Studio's concern, in Studio's own repo.
export interface ProductRepository {
  loadAll(): Promise<Product[]>
}
