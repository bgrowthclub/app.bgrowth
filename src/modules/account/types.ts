// A member's request to delete their account and data (api/account.ts,
// Portal migration 0039).
export interface DeletionRequest {
  id: string
  status: 'pending' | 'cancelled' | 'completed' | 'rejected'
  reason: string | null
  source: 'website' | 'portal'
  requested_at: string
  decided_at: string | null
  // The team's reason, when they couldn't complete it.
  admin_note: string | null
}

// Account → Purchases (api/account.ts?resource=purchases, Sprint 119).
// A paid order, read from Stripe (Website and Portal share the account).
export interface AccountOrder {
  id: string
  createdAt: string
  amount: number
  currency: string
  refunded: number | null
  status: 'paid' | 'refunded' | 'partly_refunded' | 'pending'
  productSlug: string | null
  productName: string | null
  isBundle: boolean
  receiptUrl: string | null
}

// One access on the member's account (a license or a team grant) and where
// it came from.
export interface AccountAccess {
  id: string
  kind: 'purchase' | 'free' | 'trial' | 'team' | 'other'
  productName: string
  productSlug: string | null
  origin: string
  startedAt: string | null
  endsAt: string | null
  status: 'active' | 'expired' | 'cancelled'
}

export interface AccountPurchases {
  orders: AccountOrder[]
  accesses: AccountAccess[]
  // false = Stripe couldn't be read just now (the accesses still show).
  ordersAvailable: boolean
}
