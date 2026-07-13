import type { Product } from '../../modules/commerce/types/product'
import { createEmptyProductAssets } from '../../modules/commerce/types/assets'
import { createInitialVersioning } from '../../modules/commerce/types/version'

let draftCounter = 0

// A blank Product draft for the "+ New Product" flow — deliberately
// GrowthSystem-typed by default (today's only real product type) but every
// field is editable, including `type` itself, since the Product Engine
// must support every ProductType, not just a Workspace-backed one.
export function createEmptyProductDraft(): Product {
  draftCounter += 1
  return {
    id: `draft-${Date.now()}-${draftCounter}`,
    slug: '',
    title: '',
    description: '',
    category: 'business-entrepreneurship',
    basePrice: 0,
    baseCurrency: 'USD',
    paymentProfileId: 'standard',
    visibility: 'paid',
    type: 'GrowthSystem',
    assets: createEmptyProductAssets(),
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
    versioning: createInitialVersioning(),
  }
}
