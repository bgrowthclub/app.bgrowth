import type { Benefit, Coupon, Discount } from '../types/benefits'

export const MOCK_BENEFITS: Benefit[] = [
  {
    id: 'benefit-001',
    type: 'partner-discount',
    title: '15% off SuretyBond Direct',
    description: 'Member discount on notary bonds and E&O insurance.',
    partnerId: 'partner-suretybond',
    requiredMembershipTier: 'club',
  },
  {
    id: 'benefit-002',
    type: 'software-discount',
    title: '2 months free on QuickBooks Self-Employed',
    description: 'Member offer for BGrowth Club members.',
    partnerId: 'partner-quickbooks',
    requiredMembershipTier: 'club',
  },
  {
    id: 'benefit-003',
    type: 'exclusive-offer',
    title: 'Early access to new Business Systems',
    description: 'Club members see new systems before they go public.',
    requiredMembershipTier: 'club',
  },
  {
    id: 'benefit-004',
    type: 'coupon',
    title: '$10 off your first Business System',
    description: 'A welcome coupon for new members.',
    code: 'WELCOME10',
    expiresAt: '2026-12-31T00:00:00.000Z',
  },
]

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'coupon-welcome10',
    code: 'WELCOME10',
    type: 'fixed',
    value: 10,
    appliesTo: 'all',
    maxRedemptions: 1,
    expiresAt: '2026-12-31T00:00:00.000Z',
  },
]

export const MOCK_DISCOUNTS: Discount[] = [
  { id: 'discount-club-all', label: 'Club member pricing', type: 'percent', value: 20, membershipTier: 'club' },
]

export function getMockCouponByCode(code: string) {
  return MOCK_COUPONS.find((c) => c.code.toLowerCase() === code.toLowerCase())
}
