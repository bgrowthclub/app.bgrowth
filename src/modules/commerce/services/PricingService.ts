import type { Money, CurrencyCode, TaxRule } from '../types/pricing'
import type { ProductType } from '../types/product'

// Interface only — no implementation.
export interface PricingService {
  getPrice(productId: string, currency: CurrencyCode): Promise<Money>
  convertCurrency(amount: Money, toCurrency: CurrencyCode): Promise<Money>
  getApplicableTaxRule(region: string, productType: ProductType): Promise<TaxRule | undefined>
}
