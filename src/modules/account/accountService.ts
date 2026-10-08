import { supabase } from '../identity/supabase/supabaseClient'
import type { DeletionRequest } from './types'

// The member's own account requests — every call goes to api/account.ts
// with the signed-in member's token.
async function call<T>(method: 'GET' | 'POST' | 'DELETE', body?: unknown): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (!session) throw new Error('Sign in to continue.')
  const response = await fetch('/api/account?resource=deletion', {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T
  if (!response.ok || !json.ok) throw new Error(json.error ?? `Request failed (${response.status}).`)
  return json
}

export const accountService = {
  async getDeletionRequest() {
    return (await call<{ request: DeletionRequest | null }>('GET')).request
  },
  async requestDeletion(reason: string) {
    return (await call<{ request: DeletionRequest }>('POST', { reason, source: 'website' })).request
  },
  async cancelDeletion() {
    return (await call<{ request: DeletionRequest }>('DELETE')).request
  },
}
