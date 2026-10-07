import { supabase } from '../identity/supabase/supabaseClient'
import type { GrowthCategoryId } from '../../types/growth'
import type { NewsletterPreferences } from './types'

// Every newsletter call goes to api/newsletter.ts. The signed-in member's
// token rides along when there is one, so a member subscribing their own
// confirmed address skips the confirmation e-mail.

async function call<T>(method: 'GET' | 'POST' | 'PUT', resource: string, params?: Record<string, string>, body?: unknown, requireSession = false): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (requireSession && !session) throw new Error('Sign in to continue.')
  const search = new URLSearchParams({ resource, ...params })
  const response = await fetch(`/api/newsletter?${search.toString()}`, {
    method,
    headers: {
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T
  if (!response.ok || !json.ok) throw new Error(json.error ?? `Request failed (${response.status}).`)
  return json
}

export const newsletterService = {
  // Subscribes at once. A new subscription comes back with its token, so
  // the form can ask for interests right away; an address that was already
  // subscribed comes back without one.
  subscribe(email: string, source: string, website = '') {
    return call<{ status: 'subscribed'; token?: string }>('POST', 'subscribe', undefined, { email, source, website })
  },
  confirm(token: string) {
    return call<NewsletterPreferences>('POST', 'confirm', undefined, { token })
  },
  getPreferences(token: string) {
    return call<NewsletterPreferences>('GET', 'preferences', { token })
  },
  savePreferences(token: string, patch: { interests?: GrowthCategoryId[]; status?: 'subscribed' | 'unsubscribed' }) {
    return call<NewsletterPreferences>('POST', 'preferences', undefined, { token, ...patch })
  },
  getMine() {
    return call<NewsletterPreferences>('GET', 'me', undefined, undefined, true)
  },
  saveMine(subscribed: boolean, interests: GrowthCategoryId[]) {
    return call<NewsletterPreferences>('PUT', 'me', undefined, { subscribed, interests }, true)
  },
}
