import type { GrowthCategoryId } from '../../../types/growth'
import type { CurrencyCode } from './pricing'
import type { ContentSourceRef } from './contentSource'
import type { ProductAssets } from './assets'
import type { ProductVersioning } from './version'

// Every kind of sellable thing across the whole BGrowth ecosystem — not
// just Business Systems. Support requested by Milestone 5.1. `Planner` and
// `Calculator` cover the standalone, single-module products PRODUCT_CATALOG
// .md already names as their own trademarked nouns (Planner™, Calculator™ —
// see CLAUDE.md §10) once a category sells one outside a bundled
// GrowthSystem — e.g. a Budget Planner™ sold on its own in Personal
// Finance. Used by lib/productLibrary.ts to derive a product's primary
// action label/route — never hardcode that label per call site.
export type ProductType =
  | 'GrowthSystem'
  | 'Course'
  | 'Membership'
  | 'MarketplaceProduct'
  | 'Download'
  | 'Template'
  | 'Planner'
  | 'Calculator'
  | 'AIAssistant'
  | 'Service' // future
  | 'Event' // future
  | 'Certification'
  | 'Bundle'
  | 'Subscription'

export type ProductStatus = 'draft' | 'published' | 'archived' | 'coming-soon'

export type ProductDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

// How a published product is actually offered to a visitor — orthogonal to
// `status` (the admin/publishing lifecycle). A product can be `published`
// and still be `coming-soon` in the storefront sense (e.g. pre-orders) or
// `private` (unlisted, reachable only by direct link).
export type ProductVisibility = 'free' | 'paid' | 'coming-soon' | 'private'

export interface ProductFaqItem {
  question: string
  answer: string
}

// Meta Title/Description/Keywords for the product's public page — see
// pages/ProductPage.tsx's <SEO> usage for the shape this ultimately feeds.
export interface ProductSeo {
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
}

export interface ProductBenefit {
  title: string
  description: string
}

// The universal, provider-agnostic commerce listing. This is deliberately
// NOT a replacement for BusinessSystem (the Runtime's content model) — it's
// the sellable wrapper around it, and around every other kind of product
// (courses, marketplace items, subscriptions) BGrowth offers. See
// ARCHITECTURE.md for how the two relate.
export interface Product {
  id: string
  slug: string
  title: string
  subtitle?: string
  description: string
  // Longer, product-page-length copy — `description` stays the short,
  // card/search-facing blurb it already was; this is additive, not a
  // replacement (see the Product Engine's General tab).
  longDescription?: string
  category: GrowthCategoryId
  // Marketing taxonomy, mirroring BusinessSystem.industry (e.g. "Legal") —
  // optional since not every ProductType has one (a Membership doesn't).
  // Auto-filled from the selected Content Source by the Product Engine,
  // then editable like every other General-tab field.
  industry?: string
  language?: string // BCP-47-ish tag (e.g. "en") — for a future multi-language catalog
  version?: string // e.g. "1.0" — the Product record's own display version, distinct from `versioning` (see types/version.ts)
  price: number
  currency: CurrencyCode
  salePrice?: number
  clubDiscountPercent?: number
  affiliateCommissionPercent?: number
  visibility?: ProductVisibility
  type: ProductType
  // All media — Thumbnail, Hero Image, Gallery, Preview Images, Videos,
  // Downloads — lives on this one model instead of scattered top-level
  // fields. See types/assets.ts.
  assets: ProductAssets
  featured: boolean
  status: ProductStatus
  benefits: ProductBenefit[]
  whatsIncluded?: string[]
  faq?: ProductFaqItem[]
  relatedProductIds?: string[]
  seo?: ProductSeo
  tags: string[]
  difficulty?: ProductDifficulty
  estimatedTime?: string
  workspaceEnabled: boolean
  academyEnabled: boolean
  communityEnabled: boolean
  aiEnabled: boolean
  partnerOffers: string[] // AffiliatePartner ids (see partners.ts)
  rewardPoints: number
  // What real content this product sells — see types/contentSource.ts.
  // Generalizes what earlier milestones called "the selected Workspace":
  // any registered Content Source type can populate this, not only
  // GrowthSystem.
  source?: ContentSourceRef
  // Draft/Published version history — see types/version.ts. Publishing
  // appends a new version instead of overwriting the last one.
  versioning: ProductVersioning
  createdAt?: string // ISO date string — set on first save
  updatedAt?: string // ISO date string — set on every save
  // Escape hatch for fields a future product type or provider needs before
  // this interface is formally extended — never read ad hoc without also
  // adding the field properly once its shape is known.
  futureFields?: Record<string, unknown>
}

// One row of a published product index — see ProductIndex below. Just
// enough of Product to filter, search, and list without loading that
// product's full JSON body; derived from Product itself (Pick, not a
// re-typed copy) so the two can never drift apart.
export type ProductIndexEntry = Pick<
  Product,
  'id' | 'slug' | 'title' | 'description' | 'type' | 'category' | 'status' | 'featured' | 'tags'
>

// The published manifest a Remote Product Source exposes — one lightweight
// document listing every available product. The Runtime loads this first;
// ProductService then loads a product's full JSON only for entries that
// actually match a filter/search (see services/ProductRepository.ts and
// services/ProductService.ts). Not implemented yet — see ProductRepository
// for where this plugs in.
export interface ProductIndex {
  generatedAt: string // ISO date string — when this index was published
  products: ProductIndexEntry[]
}
