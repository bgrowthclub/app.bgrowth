import type { PaymentManager } from '../services/PaymentManager'
import { createPaymentManager } from '../services/PaymentManager'
import type { ProviderId } from '../types/provider'
import type { PaymentProvider } from '../services/PaymentProvider'
import { stripeProvider } from '../services/providers/StripeProvider'

// Every registered PaymentProvider, keyed by ProviderId — Stripe is the
// only entry today. Adding a second provider is exactly one new entry
// here, never a change to PaymentManager's logic, CommerceEngine, or
// Checkout — see ARCHITECTURE.md's "Adding a second provider" section.
const PROVIDERS: Partial<Record<ProviderId, PaymentProvider>> = {
  stripe: stripeProvider,
}

// The real, server-only PaymentManager singleton — this is the only file
// in the application that imports StripeProvider's concrete module (and
// therefore the only place the `stripe` SDK is ever pulled in). Only
// /api/checkout.ts imports this. See CommerceEngineClient.ts for the
// browser's side of this seam, and ARCHITECTURE.md's "Server/client
// boundary" section for why the split exists.
export const paymentManager: PaymentManager = createPaymentManager(PROVIDERS)
