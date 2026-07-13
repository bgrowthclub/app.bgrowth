import type { AffiliatePartner, AffiliateCommission, PartnerCategory } from '../types/partners'

// Interface only — no implementation. Prepares for BGrowth Partners™.
export interface PartnerService {
  listPartners(category?: PartnerCategory): Promise<AffiliatePartner[]>
  getPartnerById(id: string): Promise<AffiliatePartner | undefined>
  trackAffiliateClick(linkId: string): Promise<void>
  listCommissionsForPartner(partnerId: string): Promise<AffiliateCommission[]>
}
