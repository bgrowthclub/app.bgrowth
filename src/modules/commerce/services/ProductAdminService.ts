import type { Product } from '../types/product'
import type { ProductVersion, ProductVersioning } from '../types/version'
import { MOCK_PRODUCTS } from '../mock/mockProducts'

// The write counterpart to ProductService (read-only, used by the
// Runtime/website side). ProductAdminService exists specifically for the
// Product Engine (see src/studio/) — the Runtime never imports this.
// Backed by the same MOCK_PRODUCTS array ProductService's local repository
// reads from, so a save here is immediately visible to both, exactly like
// a shared database would be. A future real implementation swaps the
// backing store for an API/database call; this interface doesn't change.
export interface ProductAdminService {
  getAll(): Promise<Product[]>
  getById(id: string): Promise<Product | undefined>
  // Creates the product if `id` isn't already present, otherwise updates
  // it in place. Does not change `status` — see publish/archive for that.
  save(product: Product): Promise<Product>
  publish(id: string): Promise<Product>
  archive(id: string): Promise<Product>
}

export function createProductAdminService(): ProductAdminService {
  function requireProduct(id: string): Product {
    const product = MOCK_PRODUCTS.find((p) => p.id === id)
    if (!product) throw new Error(`Product "${id}" not found`)
    return product
  }

  return {
    // A fresh array copy every call — MOCK_PRODUCTS itself is never
    // reassigned, only mutated in place, so returning it directly would
    // hand back the exact same array reference on every call. Studio's
    // React state (`setProducts`) bails out of re-rendering when it
    // receives a reference it already has, which would silently hide
    // every save/publish/archive from the UI.
    async getAll() {
      return [...MOCK_PRODUCTS]
    },

    async getById(id) {
      return MOCK_PRODUCTS.find((p) => p.id === id)
    },

    async save(product) {
      const now = new Date().toISOString()
      const existing = MOCK_PRODUCTS.find((p) => p.id === product.id)
      // Every save bumps the draft version, whether or not the product has
      // ever been published — see types/version.ts. This never touches
      // `history`; only publish() appends to it.
      const versioning: ProductVersioning = {
        ...(existing?.versioning ?? product.versioning),
        draftVersion: (existing?.versioning ?? product.versioning).draftVersion + 1,
      }
      const saved: Product = {
        ...product,
        versioning,
        createdAt: existing?.createdAt ?? product.createdAt ?? now,
        updatedAt: now,
      }
      const index = MOCK_PRODUCTS.findIndex((p) => p.id === product.id)
      if (index >= 0) {
        MOCK_PRODUCTS[index] = saved
      } else {
        MOCK_PRODUCTS.push(saved)
      }
      return saved
    },

    // Appends a new ProductVersion snapshot to `history` and moves
    // `publishedVersion` to point at it — publishing never overwrites a
    // prior published version in place, so every past published state of
    // the product stays inspectable (see types/version.ts).
    async publish(id) {
      const product = requireProduct(id)
      const now = new Date().toISOString()
      const { versioning, ...snapshot } = product
      const version = (versioning.history[versioning.history.length - 1]?.version ?? 0) + 1
      const newVersion: ProductVersion = { version, publishedAt: now, snapshot }
      // A new object, not an in-place mutation — like save() above, this
      // keeps the object reference itself changing so React state that
      // holds a stale reference to the pre-publish product is forced to
      // re-render instead of silently bailing out.
      const published: Product = {
        ...product,
        status: 'published',
        updatedAt: now,
        versioning: {
          draftVersion: version + 1,
          publishedVersion: version,
          history: [...versioning.history, newVersion],
        },
      }
      const index = MOCK_PRODUCTS.findIndex((p) => p.id === id)
      MOCK_PRODUCTS[index] = published
      return published
    },

    async archive(id) {
      const product = requireProduct(id)
      const archived: Product = { ...product, status: 'archived', updatedAt: new Date().toISOString() }
      const index = MOCK_PRODUCTS.findIndex((p) => p.id === id)
      MOCK_PRODUCTS[index] = archived
      return archived
    },
  }
}

export const productAdminService: ProductAdminService = createProductAdminService()
