import type { ProductRepository } from '../services/ProductRepository'
import type { Product, ProductIndexEntry } from '../types/product'
import type { CurrencyCode } from '../types/pricing'
import { createEmptyProductAssets } from '../types/assets'
import { createInitialVersioning } from '../types/version'
import { studioWorkspaceService, isStudioCatalogAvailable } from '../../workspace/services/studioWorkspaceService'
import { categoryResolver } from '../../workspace/categories'
import type { CategoryPlacement, ResolveCategory } from '../../workspace/categories'
import type {
  PortalCatalogRow,
  PortalCategoryRow,
  PortalProductRow,
} from '../../workspace/types/portal'

// The real catalog: every Workspace BGrowth Studio has published to the
// Portal's database, mapped onto Commerce's Product. Only what Studio
// actually publishes is filled in — nothing is invented (no difficulty,
// no estimated time, no benefits unless Studio sent them).
//
// Product ids are prefixed ("studio-<portal uuid>") so the composite
// repository (see ProductCatalogService.ts) knows where to load each one.

const ID_PREFIX = 'studio-'
const CACHE_MS = 60_000
const KNOWN_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'BRL', 'MXN', 'CAD']

export function isStudioProductId(id: string) {
  return id.startsWith(ID_PREFIX)
}

function toCurrency(code: string): CurrencyCode {
  const upper = code.toUpperCase() as CurrencyCode
  return KNOWN_CURRENCIES.includes(upper) ? upper : 'USD'
}

function price(isFree: boolean, cents: number | null) {
  return isFree || cents == null ? 0 : cents / 100
}

interface CatalogSnapshot {
  rows: PortalCatalogRow[]
  resolveCategory: ResolveCategory
}

let cache: { at: number; snapshot: Promise<CatalogSnapshot> } | undefined

function loadSnapshot(): Promise<CatalogSnapshot> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.snapshot
  const snapshot = Promise.all([studioWorkspaceService.listCatalog(), studioWorkspaceService.listCategories()]).then(
    ([rows, categories]: [PortalCatalogRow[], PortalCategoryRow[]]) => ({
      // Only Workspaces for now — the one content type the viewer opens.
      rows: rows.filter((r) => r.content_type === 'workspace'),
      resolveCategory: categoryResolver(categories),
    }),
  )
  // A failed load isn't cached — the next caller retries.
  snapshot.catch(() => {
    cache = undefined
  })
  cache = { at: Date.now(), snapshot }
  return snapshot
}

function baseProduct(
  row: Pick<PortalCatalogRow, 'slug' | 'name' | 'short_description' | 'cover_image_url' | 'is_free' | 'price_cents' | 'currency'>,
  portalId: string,
  placement: CategoryPlacement,
): Product {
  const assets = createEmptyProductAssets()
  if (row.cover_image_url) {
    assets.thumbnail = row.cover_image_url
    assets.heroImage = row.cover_image_url
  }
  return {
    id: `${ID_PREFIX}${portalId}`,
    slug: row.slug,
    title: row.name,
    description: row.short_description,
    category: placement.area,
    industry: placement.industry,
    basePrice: price(row.is_free, row.price_cents),
    baseCurrency: toCurrency(row.currency),
    paymentProfileId: row.is_free ? 'free' : 'standard',
    visibility: row.is_free ? 'free' : 'paid',
    type: 'GrowthSystem',
    assets,
    featured: false,
    status: 'published',
    benefits: [],
    tags: [],
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: false,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 0,
    source: { type: 'StudioWorkspace', id: row.slug },
    versioning: createInitialVersioning(),
  }
}

function fromCatalogRow(row: PortalCatalogRow, resolveCategory: ResolveCategory): Product {
  return {
    ...baseProduct(row, row.product_id, resolveCategory(row.category_id)),
    featured: row.is_featured,
    tags: row.tags ?? [],
    createdAt: row.published_at ?? undefined,
    updatedAt: row.updated_at,
  }
}

// Studio's metadata is free-form JSON — every field is read defensively so
// one unexpected shape never hides a product.
function arrayOf<T>(value: unknown, keep: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(keep) : []
}
const isString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const isTitled = (v: unknown): v is { title: string; description?: string } =>
  typeof v === 'object' && v !== null && typeof (v as { title?: unknown }).title === 'string'
const isFaq = (v: unknown): v is { question: string; answer: string } =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as { question?: unknown }).question === 'string' &&
  typeof (v as { answer?: unknown }).answer === 'string'

// The full product adds Studio's optional marketing fields from
// products.metadata (Portal: src/types/productMarketing.ts).
export function studioProductFromRow(row: PortalProductRow, placement: CategoryPlacement, featured = false): Product {
  const meta = (row.metadata ?? {}) as Record<string, unknown>
  const product = baseProduct(row, row.id, placement)
  const screenshots = arrayOf(meta.screenshots, isString).map((url, i) => ({ id: `screenshot-${i + 1}`, url }))
  const included = arrayOf(meta.included, isString)
  const faq = arrayOf(meta.faq, isFaq)
  return {
    ...product,
    featured,
    longDescription: isString(meta.longDescription) ? meta.longDescription : undefined,
    benefits: arrayOf(meta.features, isTitled).map(({ title, description }) => ({ title, description: description ?? '' })),
    whatsIncluded: included.length ? included : undefined,
    faq: faq.length ? faq : undefined,
    tags: arrayOf(meta.tags, isString),
    assets: { ...product.assets, previewImages: screenshots, gallery: screenshots },
    createdAt: row.last_published_at ?? row.created_at,
  }
}

export function createStudioProductRepository(): ProductRepository {
  return {
    async loadIndex() {
      if (!isStudioCatalogAvailable) return { generatedAt: new Date().toISOString(), products: [] }
      const { rows, resolveCategory } = await loadSnapshot()
      const products: ProductIndexEntry[] = rows.map((row) => {
        const p = fromCatalogRow(row, resolveCategory)
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          description: p.description,
          type: p.type,
          category: p.category,
          status: p.status,
          featured: p.featured,
          tags: p.tags,
        }
      })
      return { generatedAt: new Date().toISOString(), products }
    },

    loadProduct(id) {
      if (!isStudioCatalogAvailable || !isStudioProductId(id)) return Promise.resolve(undefined)
      const hit = productCache.get(id)
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.product
      const product = loadFullProduct(id.slice(ID_PREFIX.length))
      product.catch(() => productCache.delete(id))
      productCache.set(id, { at: Date.now(), product })
      return product
    },
  }
}

const productCache = new Map<string, { at: number; product: Promise<Product | undefined> }>()

async function loadFullProduct(portalId: string): Promise<Product | undefined> {
  const [rows, snapshot] = await Promise.all([
    studioWorkspaceService.getProductsByIds([portalId]),
    loadSnapshot().catch(() => undefined),
  ])
  const row = rows[0]
  if (!row) return undefined
  const catalogRow = snapshot?.rows.find((r) => r.product_id === portalId)
  const placement = snapshot ? snapshot.resolveCategory(row.category_id) : categoryResolver([])(null)
  return studioProductFromRow(row, placement, catalogRow?.is_featured ?? false)
}
