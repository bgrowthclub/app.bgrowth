import { supabase } from '../identity/supabase/supabaseClient'
import type { SupportState, SupportThread } from './types'

// The member side of the Support Center — every call goes to api/support.ts
// with the member's access token; the server only ever returns their own
// conversations.

async function call<T>(method: 'GET' | 'POST', resource: string, params?: Record<string, string>, body?: unknown): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (!session) throw new Error('Sign in to contact support.')
  const search = new URLSearchParams({ resource, ...params })
  const response = await fetch(`/api/support?${search.toString()}`, {
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

export const supportService = {
  getState() {
    return call<SupportState>('GET', 'state')
  },
  getConversation(id: string) {
    return call<SupportThread>('GET', 'conversation', { id })
  },
  async startConversation(subject: string, message: string) {
    return (await call<{ id: string }>('POST', 'conversations', undefined, { subject, message })).id
  },
  async sendMessage(conversationId: string, body: string) {
    await call('POST', 'messages', undefined, { conversationId, body })
  },
}
