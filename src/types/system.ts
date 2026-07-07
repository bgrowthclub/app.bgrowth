// Core catalog types.
//
// Architecture: a Business System is the top-level product a customer buys.
// It bundles one or more independent Components — each Component is a
// Planner™, Workflow™, Toolkit™, Resource™, Template™, or Guide™ with its
// own interactive content. Components are self-contained on purpose: a
// future admin tool (BGrowth Studio) can create a Component once and reuse
// it across many Business Systems.
//
// This sprint renders only the first Component on the Interactive System
// page — no cross-component navigation, no saved progress, no database.
// The shape below is what makes adding that navigation later a page-level
// change, not a data-model change.

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

// The vocabulary is fixed by product philosophy — never "Checklist."
export type ComponentType = 'Planner' | 'Workflow' | 'Toolkit' | 'Resource' | 'Template' | 'Guide'

export interface SystemComponent {
  id: string
  name: string // e.g. "Notary Equipment Planner™"
  type: ComponentType
  description?: string
  content: SystemSection[]
}

export interface SystemFeature {
  title: string
  description: string
}

export interface SystemResource {
  title: string
  type: 'Template' | 'Guide' | 'Calculator' | 'Resource'
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

export interface BusinessSystem {
  slug: string
  name: string
  category: string
  type: SystemArchetype
  difficulty: Difficulty
  shortDescription: string
  description: string
  modules: number
  estimatedTime: string
  price: number
  memberPrice: number
  checkoutUrl: string
  audience: string[]
  relatedSlugs: string[]
  features: SystemFeature[]
  whatsIncluded: string[]
  resources: SystemResource[]
  reviews: SystemReview[]
  faq: SystemFaq[]
  components: SystemComponent[]
}

export interface PurchasedSystem {
  slug: string
  purchasedOn: string
}
