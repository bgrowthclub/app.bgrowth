import type { Product } from '../../modules/commerce/types/product'

let draftCounter = 0

// A blank Product draft for the "+ New Product" flow — deliberately
// GrowthSystem-typed by default (today's only real product type) but every
// field is editable, including `type` itself, since the Product Engine
// must support every ProductType, not just Workspace.
export function createEmptyProductDraft(): Product {
  draftCounter += 1
  return {
    id: `draft-${Date.now()}-${draftCounter}`,
    slug: '',
    title: '',
    description: '',
    category: 'business-entrepreneurship',
    price: 0,
    currency: 'USD',
    visibility: 'paid',
    type: 'GrowthSystem',
    featured: false,
    status: 'draft',
    benefits: [],
    tags: [],
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: false,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 0,
  }
}
