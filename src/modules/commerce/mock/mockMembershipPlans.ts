import type { MembershipPlan } from '../types/membership'
import { MEMBERSHIP_PLANS, getMembershipPlanByTier } from '../../../data/membershipPlans'

// The plan catalog lives in data/membershipPlans.ts (the one place prices,
// promotions and plan contents are edited). These names are kept so
// existing Commerce/Identity callers keep compiling — there is no second
// list of plans.
export const MOCK_MEMBERSHIP_PLANS: MembershipPlan[] = MEMBERSHIP_PLANS

export function getMockMembershipPlanByTier(tier: MembershipPlan['tier']) {
  return getMembershipPlanByTier(tier)
}
