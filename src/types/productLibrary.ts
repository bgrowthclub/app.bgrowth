import type { LucideIcon } from 'lucide-react'
import type { ProductType } from '../modules/commerce/types/product'
import type { Purchase } from '../modules/commerce/types/purchase'
import type { ProductAccess } from '../modules/commerce/types/access'
import type { UserProgress } from '../modules/identity/types/user'

// One member's owned/accessible instance of any BGrowth product — the
// Product Library's view-model ("My Workspaces" today; the same shape will
// carry an Academy course, a standalone Planner™/Calculator™, a
// Membership, AI credits, etc. once those exist — see
// lib/productLibrary.ts). Deliberately NOT named or modeled around
// "Workspace" or "Owned": every field here is generic across product
// types, and `type` (Commerce's ProductType) is what drives the card's
// icon, badge, and primary action — never a per-call-site hardcoded label.
//
// This composes three things that live in different domains and have no
// other reason to be merged:
//   - Runtime/catalog content (today only BusinessSystem, read via
//     getSystemBySlug) — flattened onto the fields below rather than kept
//     as a nested `system` reference, so this type stays meaningful for a
//     future product with no BusinessSystem behind it at all.
//   - Commerce's transaction record (`Purchase`) and access grant
//     (`ProductAccess`)
//   - BGrowth Identity™'s own per-product progress (`UserProgress`), used
//     only to derive the card's "Status" (see lib/productLibrary.ts)
// Nothing here replaces Purchase/ProductAccess/UserProgress; it only
// combines them for display, and is the natural seed for a future
// PurchaseService.listPurchasesForMember() + ProductAccess lookup once a
// real Purchase Database exists (Stripe Payment → Webhook → Purchase
// Database → User Library → Open Workspace).
export interface UserProduct {
  productId: string
  type: ProductType
  slug: string
  title: string
  description: string
  icon: LucideIcon
  tag: string // primary badge — e.g. a GrowthSystem's industry
  subTag?: string // secondary badge — e.g. a GrowthSystem's narrower category
  difficulty?: string
  estimatedTime?: string
  purchase: Purchase
  access: ProductAccess
  lastOpenedAt?: string // ISO date string — omitted if never opened
  progress?: UserProgress
}

export type ProductLibraryStatus = 'not-started' | 'in-progress' | 'completed'

// The two states every product resolves to — purely derived from
// ProductAccess.hasAccess. A future Stripe-backed ProductAccess lookup
// would flip this without any UI needing to change (see
// lib/productLibrary.ts's getProductAccessState).
export type ProductAccessState = 'purchased' | 'not-purchased'
