import type { GrowthCategoryId } from '../../../types/growth'
import type { CurrencyCode } from './pricing'

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

export type ProductStatus = 'draft' | 'published' | 'archived'

export type ProductDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

// Points a Product back at the real content it sells, without duplicating
// that content's data. A `GrowthSystem` Product, for example, points at a
// slug in data/systems.ts — Commerce never forks or re-authors catalog
// content; it only describes how something already defined elsewhere is
// sold. See ARCHITECTURE.md's Commerce Architecture section.
export interface ProductSourceRef {
  type: 'GrowthSystem' | 'Course' | 'MarketplaceItem' | 'MembershipPlan' | 'Bundle' | 'External'
  id: string
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
  category: GrowthCategoryId
  price: number
  currency: CurrencyCode
  type: ProductType
  thumbnail?: string
  featured: boolean
  status: ProductStatus
  benefits: ProductBenefit[]
  tags: string[]
  difficulty?: ProductDifficulty
  estimatedTime?: string
  workspaceEnabled: boolean
  academyEnabled: boolean
  communityEnabled: boolean
  aiEnabled: boolean
  partnerOffers: string[] // AffiliatePartner ids (see partners.ts)
  rewardPoints: number
  source?: ProductSourceRef
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
