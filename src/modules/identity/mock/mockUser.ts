import type { User } from '../types/user'
import { MOCK_MEMBER_NAME, PURCHASED_SLUGS } from '../../../data/memberMock'

// Wraps the existing mock member constants (data/memberMock.ts) into the
// full BGrowth Identity™ User shape — it does not redefine "who the mock
// member is," it just gives that same data a proper, typed home. The
// membership tier id below ('free') is the Commerce-side counterpart to
// MembershipBadge's display label ("Free Plan") — see
// modules/commerce/mock/mockMembershipPlans.ts's 'plan-free' entry.
const [mockFirstName, ...mockLastNameParts] = MOCK_MEMBER_NAME.split(' ')

export const MOCK_USER: User = {
  id: 'user-mock-1',
  email: 'jordan@example.com',
  displayName: MOCK_MEMBER_NAME,
  firstName: mockFirstName,
  lastName: mockLastNameParts.join(' '),
  membership: 'free',
  language: 'en',
  country: 'US',
  timezone: 'America/New_York',
  preferences: { theme: 'system', locale: 'en-US' },
  workspace: { sidebarCollapsed: false, defaultView: 'grid', showContinueBuilding: true },
  achievements: {
    badgeIds: ['badge-first-system'],
    achievementIds: ['achievement-launch-complete'],
    points: 150,
    level: 2,
  },
  rewards: 150,
  benefits: ['benefit-004'],
  ownedProducts: PURCHASED_SLUGS,
  createdProducts: [],
  favoriteProducts: [],
  progress: [{ productId: PURCHASED_SLUGS[1], percentComplete: 40, lastActivityAt: '2026-07-01T00:00:00.000Z' }],
  settings: {
    notifications: {
      emailNotifications: true,
      productUpdates: true,
      communityActivity: false,
      marketingEmails: false,
    },
    security: { twoFactorEnabled: false, activeSessionCount: 1 },
    privacy: {
      profileVisibility: 'members-only',
      showActivityToCommunity: true,
      allowDataForRecommendations: true,
    },
  },
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}
