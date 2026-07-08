import type { MembershipPlan } from '../types/membership'
import type { UserEntitlement } from '../types/access'

// Interface only — no implementation.
export interface MembershipService {
  getPlanById(id: string): Promise<MembershipPlan | undefined>
  listPlans(): Promise<MembershipPlan[]>
  getMemberPlan(memberId: string): Promise<MembershipPlan | undefined>
  assignPlanToMember(memberId: string, planId: string): Promise<UserEntitlement>
}
