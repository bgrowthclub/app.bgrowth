import type { Reward, Badge, Achievement, MemberLevel, ReferralReward } from '../types/rewards'

export const MOCK_BADGES: Badge[] = [
  { id: 'badge-first-system', name: 'First System', description: 'Completed your first Business System.', category: 'business-entrepreneurship' },
  { id: 'badge-referrer', name: 'Ambassador', description: 'Referred a new BGrowth member.' },
]

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'achievement-launch-complete', name: 'Launch Complete', description: 'Finished a Business Launch System end to end.', pointsAwarded: 100, badgeId: 'badge-first-system' },
]

export const MOCK_MEMBER_LEVELS: MemberLevel[] = [
  { level: 1, name: 'Getting Started', minPoints: 0, perks: [] },
  { level: 2, name: 'Building', minPoints: 100, perks: ['Early access to new systems'] },
  { level: 3, name: 'Growing', minPoints: 500, perks: ['Early access to new systems', 'Priority support'] },
]

export const MOCK_REWARDS: Reward[] = [
  {
    id: 'reward-001',
    memberId: 'member-mock-1',
    type: 'purchase',
    points: 50,
    description: 'Purchased Start Your Notary Business™',
    relatedProductId: 'prod-001',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'reward-002',
    memberId: 'member-mock-1',
    type: 'completion',
    points: 100,
    description: 'Completed Start Your Notary Business™',
    relatedProductId: 'prod-001',
    relatedBadgeId: 'badge-first-system',
    createdAt: '2026-06-15T00:00:00.000Z',
  },
]

export const MOCK_REFERRAL_REWARDS: ReferralReward[] = [
  { id: 'referral-001', referrerMemberId: 'member-mock-1', referredMemberId: 'member-mock-2', pointsAwarded: 25, status: 'confirmed' },
]
