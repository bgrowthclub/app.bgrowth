// The generic "fetch a JSON document from wherever published products
// live" abstraction. Deliberately provider-agnostic — GitHub raw files,
// an S3 bucket, Supabase Storage, Google Cloud Storage, or a future REST
// API would all implement this the same way:
//
//   Remote Product Source
//           ↓
//   ProductRepository
//           ↓
//   ProductService
//
// Nothing above this layer (ProductRepository, ProductService, or any
// future caller) ever knows or cares which one is in use — a
// RemoteProductRepository (see ProductRepository.ts) would depend only on
// this interface, never on a specific provider's SDK or URL scheme.
//
// Not implemented yet, by design — see ProductRepository.ts for the
// currently-active (local, mock) implementation, and CLAUDE.md/this
// milestone's notes on why real remote loading isn't wired up until
// BGrowth Studio actually publishes something to point this at.
export interface RemoteProductSource {
  // Fetches and parses one JSON document by its path/key within the
  // source — e.g. "manifest.json" for the index, or
  // "products/start-your-notary-business.json" for one product's full
  // body. What "path" resolves to (a GitHub raw URL, an S3 object key, a
  // Supabase Storage path, an API route) is entirely up to the
  // implementation.
  fetchJson<T>(path: string): Promise<T>
}
