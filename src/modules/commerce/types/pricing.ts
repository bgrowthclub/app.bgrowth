// Currency and tax shapes shared across every Commerce model. Deliberately
// minimal — no provider-specific rounding/formatting logic, just the data
// shape a future PricingService would operate on.

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'BRL' | 'MXN' | 'CAD'

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
}

// A monetary amount paired with its currency — used anywhere a price or
// total travels together with its currency (Transaction, Order, Invoice).
// Product keeps `price`/`currency` as flat fields instead, per the explicit
// field list this module was built against.
export interface Money {
  amount: number
  currency: CurrencyCode
}

export interface TaxRule {
  id: string
  region: string // e.g. a country or state/province code
  rate: number // percentage, e.g. 8.25
  appliesTo: string[] | 'all' // ProductType values, or 'all'
}
