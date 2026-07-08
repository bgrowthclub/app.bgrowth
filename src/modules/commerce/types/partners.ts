import type { AffiliatePartner as CatalogAffiliatePartner } from '../../../types/system'
import type { Money } from './pricing'

export type PartnerCategory = 'software' | 'equipment' | 'financial-services' | 'education' | 'technology' | 'other'

export interface AffiliateLink {
  id: string
  partnerId: string
  url: string
  trackingCode: string
}

// This EXTENDS the existing AffiliatePartner already defined in
// types/system.ts (id/name/description/url — used today by AffiliatePanel
// inside a Business System) with the richer shape BGrowth Partners™ needs.
// It is the same partner concept, not a second, competing one — do not
// define a parallel "Partner" type elsewhere.
export interface AffiliatePartner extends CatalogAffiliatePartner {
  category: PartnerCategory
  logo?: string
  links: AffiliateLink[]
  resources: string[]
  futurePartnerFields?: Record<string, unknown>
}

export interface AffiliateCommission {
  id: string
  partnerId: string
  purchaseId: string
  amount: Money
  status: 'pending' | 'approved' | 'paid'
  createdAt: string
}
