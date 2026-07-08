import type { GrowthCategoryId } from '../../../types/growth'
import type { CurrencyCode } from './pricing'

// Every kind of sellable thing across the whole BGrowth ecosystem — not
// just Business Systems. Support requested by Milestone 5.1.
export type ProductType =
  | 'GrowthSystem'
  | 'Course'
  | 'Membership'
  | 'MarketplaceProduct'
  | 'Download'
  | 'Template'
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
