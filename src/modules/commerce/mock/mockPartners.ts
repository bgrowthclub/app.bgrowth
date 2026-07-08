import type { AffiliatePartner, AffiliateCommission } from '../types/partners'

export const MOCK_PARTNERS: AffiliatePartner[] = [
  {
    id: 'partner-suretybond',
    name: 'SuretyBond Direct',
    description: 'Notary bonds and E&O insurance, issued same-day.',
    url: 'https://example.com/suretybond',
    category: 'financial-services',
    links: [{ id: 'link-suretybond-1', partnerId: 'partner-suretybond', url: 'https://example.com/suretybond?ref=bgrowth', trackingCode: 'BGROWTH-SB-01' }],
    resources: ['State Bonding Requirements Guide'],
  },
  {
    id: 'partner-notarystamp',
    name: 'NotaryStamp Co.',
    description: 'State-compliant stamps, seals, and journals.',
    url: 'https://example.com/notarystamp',
    category: 'equipment',
    links: [{ id: 'link-notarystamp-1', partnerId: 'partner-notarystamp', url: 'https://example.com/notarystamp?ref=bgrowth', trackingCode: 'BGROWTH-NS-01' }],
    resources: ['Supplier Shortlist'],
  },
  {
    id: 'partner-quickbooks',
    name: 'QuickBooks Self-Employed',
    description: 'Bookkeeping built for solo service businesses.',
    url: 'https://example.com/quickbooks',
    category: 'software',
    links: [{ id: 'link-quickbooks-1', partnerId: 'partner-quickbooks', url: 'https://example.com/quickbooks?ref=bgrowth', trackingCode: 'BGROWTH-QB-01' }],
    resources: [],
  },
]

export const MOCK_AFFILIATE_COMMISSIONS: AffiliateCommission[] = [
  {
    id: 'commission-001',
    partnerId: 'partner-suretybond',
    purchaseId: 'purchase-001',
    amount: { amount: 8, currency: 'USD' },
    status: 'pending',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
]

export function getMockPartnerById(id: string) {
  return MOCK_PARTNERS.find((p) => p.id === id)
}
