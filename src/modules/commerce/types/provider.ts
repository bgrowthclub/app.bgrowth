// Provider-agnostic shapes. Nothing in this file — or anywhere else in
// Commerce — imports a payment provider's SDK. See ARCHITECTURE.md's
// Commerce Architecture section for the full
// Application → Commerce Engine → Provider Adapter → Stripe/PayPal/...
// flow this supports.

import type { Cart } from './purchase'

// Known providers are listed for autocomplete, but the `(string & {})`
// union member means an unlisted future provider is still a valid
// ProviderId without a type change — see CLAUDE.md's Commerce rules on
// never hardcoding a single provider.
export type KnownProviderId =
  | 'stripe'
  | 'paypal'
  | 'mercado-pago'
  | 'apple-pay'
  | 'google-pay'
  | 'hotmart'
  | 'paddle'
  | 'lemon-squeezy'

export type ProviderId = KnownProviderId | (string & {})

export interface ProviderTransactionRef {
  provider: ProviderId
  providerTransactionId: string
  providerCustomerId?: string
}

export interface CheckoutSessionRequest {
  cart: Cart
  memberId?: string
  successUrl?: string
  cancelUrl?: string
}

export interface CheckoutSessionResult {
  provider: ProviderId
  checkoutUrl: string
  sessionId: string
}
