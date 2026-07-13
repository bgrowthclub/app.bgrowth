import type { Money, CurrencyCode } from '../types/pricing'

// Interface only — no implementation. Tax-rate lookup and calculation
// moved out to TaxService — see that file — so pricing and taxation are
// separate Commerce Engine concerns.
export interface PricingService {
  getPrice(productId: string, currency: CurrencyCode): Promise<Money>
  convertCurrency(amount: Money, toCurrency: CurrencyCode): Promise<Money>
}
