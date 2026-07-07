// ---------------------------------------------------------------------------
// BGrowth Runtime™ — data model
// ---------------------------------------------------------------------------
// This is the shape a Business System is exported from BGrowth Studio in.
// The Runtime only ever *reads* this shape — it never edits a Business
// System, and it never hardcodes a page for one. Every page in this app
// (Home, Browse, Product, My Systems, the Runtime itself) is generated from
// data matching these types.
//
// For now the "package" is just a TypeScript object (see data/systems.ts).
// Nothing here assumes that — swapping the source for a fetched JSON export
// from Studio later is a data-loading change, not a type or component change.
//
// One field is commerce-only and intentionally NOT part of what Studio
// exports: `price` / `memberPrice` / `checkoutUrl`. Studio produces the
// Business System itself; selling it is the Runtime's concern. They're kept
// on the same interface for now to avoid a second type this sprint, but are
// called out below so it's clear which fields would actually come from a
// Studio export.

export type FieldType = 'checkbox' | 'text' | 'date' | 'textarea'

export interface SystemField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
}

export interface SystemSection {
  id: string
  title: string
  description?: string
  fields: SystemField[]
}

// Every module type BGrowth Studio can export. The Runtime only displays
// these — it never builds or edits them (that's Studio's Checklist
// Builder / Planner Builder / Workflow Builder / Template Builder).
//
// 'Checklist' is a real Studio module type, but the brand rule is that the
// word "Checklist" never appears in the customer-facing interface — see the
// label override in ModuleBadge.tsx, which is the one place that mapping
// lives. Everywhere else in the app, only `ModuleType` (the data value) uses
// the word; no rendered copy does.
export type ModuleType =
  | 'Checklist'
  | 'Planner'
  | 'Workflow'
  | 'Toolkit'
  | 'Guide'
  | 'Resource'
  | 'Document'
  | 'Calculator'
  | 'Template'
  | 'Video'
  | 'ExternalLink'
  | 'AIModule'

export interface BusinessModule {
  id: string // also doubles as the module's route slug: /system/:slug/module/:id
  title: string // e.g. "Notary Equipment Planner™"
  type: ModuleType
  description?: string
  estimatedTime?: string
  content: SystemSection[]
}

export interface SystemBenefit {
  title: string
  description: string
}

export interface SystemResource {
  title: string
  type: 'Template' | 'Guide' | 'Calculator' | 'Resource'
}

export interface AffiliatePartner {
  id: string
  name: string
  description: string
  url: string
}

export interface SystemReview {
  name: string
  role: string
  quote: string
  rating: number
}

export interface SystemFaq {
  question: string
  answer: string
}

// The archetype of the bundle as a whole, per the product philosophy
// examples ("Business Launch System", "Business Operations System").
export type SystemArchetype = 'Business Launch System' | 'Business Operations System' | 'Toolkit System'

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type SystemStatus = 'published' | 'draft'

export interface BusinessSystem {
  // --- Studio export fields ---
  id: string
  slug: string
  title: string
  subtitle?: string
  industry: string // broad marketing taxonomy, e.g. "Legal" (see Industries section)
  category: string // narrower catalog filter, e.g. "Notary"
  type: SystemArchetype
  difficulty: Difficulty
  estimatedTime: string
  thumbnail?: string
  heroImage?: string
  description: string
  shortDescription: string
  benefits: SystemBenefit[]
  whoIsFor: string[]
  modules: BusinessModule[]
  resources: SystemResource[]
  affiliatePartners: AffiliatePartner[]
  reviews: SystemReview[]
  faq: SystemFaq[]
  relatedSystems: string[] // slugs
  tags: string[]
  status: SystemStatus
  featured: boolean

  // --- Runtime/commerce extension (not part of a Studio export) ---
  price: number
  memberPrice: number
  checkoutUrl: string
  whatsIncluded: string[]
}

export interface PurchasedSystem {
  slug: string
  purchasedOn: string
}
