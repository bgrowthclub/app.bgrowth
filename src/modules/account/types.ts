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
