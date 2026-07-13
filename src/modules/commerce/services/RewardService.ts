import type { Reward, RewardType, Badge, MemberLevel } from '../types/rewards'

// Interface only — no implementation. Prepares for BGrowth Rewards™;
// nothing calls this yet anywhere in the app.
export interface RewardService {
  getPointsBalance(memberId: string): Promise<number>
  listRewardsForMember(memberId: string): Promise<Reward[]>
  awardReward(memberId: string, type: RewardType, points: number, description: string): Promise<Reward>
  listBadgesForMember(memberId: string): Promise<Badge[]>
  getMemberLevel(memberId: string): Promise<MemberLevel>
}
