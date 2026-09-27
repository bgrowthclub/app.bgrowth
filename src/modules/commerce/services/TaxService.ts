import type { TaxRule, Money } from '../types/pricing'
import type { ProductType } from '../types/product'

// Interface only — no implementation. Owns tax-rate lookup and
// calculation as its own Commerce Engine concern, extracted from
// PricingService so pricing and taxation aren't one growing service.
// TaxRule itself still lives in types/pricing.ts — only the service
// method that reads it moved here.
export interface TaxService {
  getApplicableTaxRule(region: string, productType: ProductType): Promise<TaxRule | undefined>
  calculateTax(amount: Money, region: string, productType: ProductType): Promise<Money>
}
