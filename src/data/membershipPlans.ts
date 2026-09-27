import type { MembershipPlan, MembershipTierId } from '../modules/commerce/types/membership'

// ───────────────────────────────────────────────────────────────────────────
// BGrowth plans — THE one place to edit plan names, prices, promotions and
// what each plan includes, until the Administration area exists (it will
// edit these same fields).
//
// Promotion: set `salePrice` on a plan's `pricing`. The site then shows the
// regular `price` struck through next to the sale price. Remove `salePrice`
// to end the promotion.
//
// What each plan includes is still a draft (27/09/2026) — adjust `features`
// freely. Academies are sold separately, with member discounts.
// ───────────────────────────────────────────────────────────────────────────
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'plan-free',
    tier: 'free',
    name: 'Free',
    description: 'Get started before you buy anything.',
    pricing: { price: 0, currency: 'USD', interval: 'month' },
    features: ['Free Business Systems', 'Free Resources™', 'Newsletter'],
    benefits: [{ title: 'No cost to start', description: 'Browse and try free systems immediately.' }],
    discounts: [],
    rewardMultiplier: 1,
    permissions: {
      workspaceAccess: true,
      marketplaceAccess: false,
      academyAccess: false,
      communityAccess: false,
      aiAccess: false,
    },
    status: 'published',
  },
  {
    id: 'plan-starter',
    tier: 'starter',
    name: 'Starter',
    description: 'For getting started with the essentials.',
    pricing: { price: 19, currency: 'USD', interval: 'month' },
    features: [
      'Access to free & starter Business Systems',
      'Member pricing on select systems',
      'Monthly newsletter',
      'Community access',
    ],
    benefits: [{ title: 'Member pricing', description: 'Discounted pricing on select Business Systems.' }],
    discounts: [{ label: 'Starter member pricing', percentOff: 10, appliesTo: 'all' }],
    rewardMultiplier: 1.1,
    permissions: {
      workspaceAccess: true,
      marketplaceAccess: false,
      academyAccess: false,
      communityAccess: true,
      aiAccess: false,
    },
    status: 'published',
  },
  {
    id: 'plan-pro',
    tier: 'pro',
    name: 'Pro',
    description: 'For professionals who want it all.',
    pricing: { price: 49, currency: 'USD', interval: 'month' },
    features: [
      'Everything in Starter',
      'Unlimited premium Business Systems',
      'Member pricing on everything',
      'Exclusive Resources™',
      'Priority support',
      'Early access to new releases',
    ],
    benefits: [{ title: 'Unlimited premium systems', description: 'Every premium Business System included.' }],
    discounts: [{ label: 'Pro member pricing', percentOff: 20, appliesTo: 'all' }],
    rewardMultiplier: 1.25,
    permissions: {
      workspaceAccess: true,
      marketplaceAccess: true,
      academyAccess: true,
      communityAccess: true,
      aiAccess: false,
    },
    status: 'published',
  },
  {
    id: 'plan-enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and growing organizations.',
    features: [
      'Everything in Pro',
      'Team seats & shared access',
      'Dedicated onboarding',
      'Custom resource requests',
    ],
    benefits: [{ title: 'Team licensing', description: 'License Growth Systems across an entire team at once.' }],
    discounts: [{ label: 'Enterprise pricing', percentOff: 25, appliesTo: 'all' }],
    rewardMultiplier: 1.5,
    permissions: {
      workspaceAccess: true,
      marketplaceAccess: true,
      academyAccess: true,
      communityAccess: true,
      aiAccess: true,
    },
    status: 'published',
  },
]

export function getMembershipPlanByTier(tier: MembershipTierId): MembershipPlan | undefined {
  return MEMBERSHIP_PLANS.find((plan) => plan.tier === tier)
}

// "$19" / "$0" — the price a member actually pays today (sale price when a
// promotion is on). Undefined when the plan has no public price.
export function formatPlanPrice(plan: MembershipPlan): string | undefined {
  if (!plan.pricing) return undefined
  const amount = plan.pricing.salePrice ?? plan.pricing.price
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

// The regular price to show struck through, only while a promotion is on.
export function formatPlanRegularPrice(plan: MembershipPlan): string | undefined {
  const pricing = plan.pricing
  if (!pricing || pricing.salePrice === undefined || pricing.salePrice >= pricing.price) return undefined
  return `$${Number.isInteger(pricing.price) ? pricing.price : pricing.price.toFixed(2)}`
}
