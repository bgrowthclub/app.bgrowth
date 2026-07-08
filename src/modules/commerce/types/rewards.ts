import type { GrowthCategoryId } from '../../../types/growth'

// Every way a member can earn something inside BGrowth Rewards™.
export type RewardType =
  | 'points'
  | 'badge'
  | 'achievement'
  | 'level'
  | 'referral'
  | 'partner'
  | 'creator'
  | 'purchase'
  | 'completion'

// A single earned-reward event/ledger entry — the record, not the
// definition of what can be earned (see Badge/Achievement/MemberLevel
// below for the definitions).
export interface Reward {
  id: string
  memberId: string
  type: RewardType
  points: number
  description: string
  relatedProductId?: string
  relatedBadgeId?: string
  createdAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon?: string
  category?: GrowthCategoryId
}

export interface Achievement {
  id: string
  name: string
  description: string
  pointsAwarded: number
  badgeId?: string
}

export interface MemberLevel {
  level: number
  name: string
  minPoints: number
  perks: string[]
}

export interface ReferralReward {
  id: string
  referrerMemberId: string
  referredMemberId: string
  pointsAwarded: number
  status: 'pending' | 'confirmed'
}
