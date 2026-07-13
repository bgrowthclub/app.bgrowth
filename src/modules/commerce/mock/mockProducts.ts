// Realistic mock Products for testing the Commerce architecture — not a
// second catalog. The GrowthSystem-type entries below intentionally mirror
// (via `source`) real slugs already in src/data/systems.ts, rather than
// re-describing their content, per Commerce's never-duplicate rule.

import type { Product } from '../types/product'
import type { ProductSnapshot, ProductVersioning } from '../types/version'
import type { ProductRepository } from '../services/ProductRepository'
import { createEmptyProductAssets } from '../types/assets'

// Every mock product below is defined without `versioning` and gets one
// attached here — `published` entries get a real v1 history entry (proving
// the version history shape actually renders), everything else starts at
// an unpublished draft v1. See types/version.ts.
function withInitialVersioning(product: ProductSnapshot): Product {
  const versioning: ProductVersioning =
    product.status === 'published'
      ? {
          draftVersion: 2,
          publishedVersion: 1,
          history: [{ version: 1, publishedAt: '2026-01-15T00:00:00.000Z', snapshot: product }],
        }
      : { draftVersion: 1, history: [] }
  return { ...product, versioning }
}

const RAW_PRODUCTS: ProductSnapshot[] = [
  {
    id: 'prod-001',
    slug: 'start-your-notary-business',
    title: 'Start Your Notary Business™',
    subtitle: 'Everything to go from licensed to booked.',
    description: 'A complete launch path from licensing to your first signing appointment.',
    category: 'business-entrepreneurship',
    price: 79,
    currency: 'USD',
    type: 'GrowthSystem',
    assets: createEmptyProductAssets(),
    featured: true,
    status: 'published',
    benefits: [{ title: 'Guided sequence', description: 'Every step unlocks the next.' }],
    tags: ['notary', 'launch', 'beginner'],
    difficulty: 'Beginner',
    estimatedTime: '2–3 weeks',
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: ['partner-suretybond'],
    rewardPoints: 50,
    source: { type: 'GrowthSystem', id: 'start-your-notary-business' },
  },
  {
    id: 'prod-002',
    slug: 'notary-fundamentals-course',
    title: 'Notary Fundamentals Course™',
    subtitle: 'Learn the profession before you commit.',
    description: 'A short Academy course covering what a mobile notary practice actually involves.',
    category: 'business-entrepreneurship',
    price: 29,
    currency: 'USD',
    type: 'Course',
    assets: createEmptyProductAssets(),
    featured: false,
    status: 'draft',
    benefits: [{ title: 'Self-paced', description: 'Learn on your own schedule.' }],
    tags: ['notary', 'academy'],
    difficulty: 'Beginner',
    estimatedTime: '3 hours',
    workspaceEnabled: false,
    academyEnabled: true,
    communityEnabled: false,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 20,
  },
  {
    id: 'prod-003',
    slug: 'notary-fundamentals-certification',
    title: 'Notary Fundamentals Certification™',
    subtitle: 'Prove you know the essentials.',
    description: 'A short assessment and certificate for members who complete the Notary Fundamentals Course.',
    category: 'business-entrepreneurship',
    price: 19,
    currency: 'USD',
    type: 'Certification',
    assets: createEmptyProductAssets(),
    featured: false,
    status: 'draft',
    benefits: [{ title: 'Shareable credential', description: 'Add it to a professional profile.' }],
    tags: ['notary', 'certification'],
    workspaceEnabled: false,
    academyEnabled: true,
    communityEnabled: false,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 30,
  },
  {
    id: 'prod-004',
    slug: 'client-confirmation-email-template',
    title: 'Client Confirmation Email Template™',
    subtitle: 'One less thing to write from scratch.',
    description: 'A ready-to-send confirmation email template for signing appointments.',
    category: 'business-entrepreneurship',
    price: 5,
    currency: 'USD',
    type: 'Template',
    assets: createEmptyProductAssets(),
    featured: false,
    status: 'published',
    benefits: [{ title: 'Copy and send', description: 'No formatting required.' }],
    tags: ['template', 'communication'],
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: false,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 5,
  },
  {
    id: 'prod-005',
    slug: 'business-coach-ai',
    title: 'Business Coach AI™',
    subtitle: 'A business coach available whenever you need one.',
    description: 'An AI assistant that helps a member think through pricing, planning, and next steps.',
    category: 'business-entrepreneurship',
    price: 15,
    currency: 'USD',
    type: 'AIAssistant',
    assets: createEmptyProductAssets(),
    featured: true,
    status: 'draft',
    benefits: [{ title: 'Available anytime', description: 'No scheduling required.' }],
    tags: ['ai', 'coaching'],
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: false,
    aiEnabled: true,
    partnerOffers: [],
    rewardPoints: 10,
  },
  {
    id: 'prod-006',
    slug: 'notary-launch-bundle',
    title: 'Notary Launch Bundle™',
    subtitle: 'Everything a first-time notary needs, together.',
    description: 'Start Your Notary Business™ and Notary Equipment System™, bundled at a lower combined price.',
    category: 'business-entrepreneurship',
    price: 99,
    currency: 'USD',
    type: 'Bundle',
    assets: createEmptyProductAssets(),
    featured: true,
    status: 'draft',
    benefits: [{ title: 'Save vs. buying separately', description: 'Bundled pricing beats buying each system on its own.' }],
    tags: ['notary', 'bundle'],
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: ['partner-suretybond', 'partner-notarystamp'],
    rewardPoints: 60,
    source: { type: 'Bundle', id: 'notary-launch-bundle' },
  },
  {
    id: 'prod-007',
    slug: 'bgrowth-club-membership',
    title: 'BGrowth Club™ Membership',
    subtitle: 'Member pricing on every Business System.',
    description: 'Recurring membership unlocking member pricing, exclusive resources, and priority access.',
    category: 'business-entrepreneurship',
    price: 19,
    currency: 'USD',
    type: 'Membership',
    assets: createEmptyProductAssets(),
    featured: true,
    status: 'draft',
    benefits: [{ title: 'Member pricing', description: 'Discounted pricing on every Business System.' }],
    tags: ['membership', 'club'],
    workspaceEnabled: true,
    academyEnabled: true,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 0,
    source: { type: 'MembershipPlan', id: 'plan-club' },
  },
]

export const MOCK_PRODUCTS: Product[] = RAW_PRODUCTS.map(withInitialVersioning)

export function getMockProductBySlug(slug: string) {
  return MOCK_PRODUCTS.find((p) => p.slug === slug)
}

export function getMockProductsByType(type: Product['type']) {
  return MOCK_PRODUCTS.filter((p) => p.type === type)
}

// The only ProductRepository implementation today — see
// services/ProductRepository.ts for what replaces this once Studio
// publishes real Product JSON through a Remote Product Source. There is no
// real cost difference here between "index" and "full body" (both just
// read the same in-memory array), but the shape matches what a remote
// implementation would do: derive the lightweight index from the full
// records, then look up one full record by id on demand.
export function createLocalProductRepository(): ProductRepository {
  return {
    async loadIndex() {
      return {
        generatedAt: new Date().toISOString(),
        products: MOCK_PRODUCTS.map(
          ({ id, slug, title, description, type, category, status, featured, tags }) => ({
            id,
            slug,
            title,
            description,
            type,
            category,
            status,
            featured,
            tags,
          }),
        ),
      }
    },

    async loadProduct(id) {
      return MOCK_PRODUCTS.find((p) => p.id === id)
    },
  }
}
