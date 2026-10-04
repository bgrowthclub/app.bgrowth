import { supabase } from '../identity/supabase/supabaseClient'
import type {
  AdminGrant,
  AdminLicense,
  AdminMemberDetail,
  AdminMemberPage,
  AdminProduct,
  AdminSalesReport,
  AdminSupportInbox,
  AdminSupportThread,
  CreateGrantResult,
  NewGrantInput,
} from './types'
import type { SupportHours } from '../support/types'

// The browser side of the Website's Administration — every call goes to
// api/admin.ts with the signed-in admin's access token. Nothing here talks
// to the database directly: admin writes need the service role, which only
// the server has.

async function call<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT', resource: string, params?: Record<string, string>, body?: unknown): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (!session) throw new Error('Sign in to continue.')

  const search = new URLSearchParams({ resource, ...params })
  const response = await fetch(`/api/admin?${search.toString()}`, {
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

export const adminService = {
  listMembers(q: string, page: number) {
    return call<AdminMemberPage>('GET', 'members', { q, page: String(page) })
  },
  getMember(id: string) {
    return call<AdminMemberDetail>('GET', 'member', { id })
  },
  async resendConfirmation(userId: string) {
    return (await call<{ sentTo: string }>('POST', 'confirmation', undefined, { userId })).sentTo
  },
  listSupport(status: 'open' | 'closed') {
    return call<AdminSupportInbox>('GET', 'support', { status })
  },
  getSupportThread(id: string) {
    return call<AdminSupportThread>('GET', 'support-thread', { id })
  },
  async replySupport(conversationId: string, body: string) {
    return (await call<{ emailed: boolean }>('POST', 'support-reply', undefined, { conversationId, body })).emailed
  },
  async setSupportStatus(conversationId: string, status: 'open' | 'closed') {
    await call('PATCH', 'support-status', undefined, { conversationId, status })
  },
  saveSupportHours(hours: SupportHours) {
    return call<{ hours: SupportHours; online: boolean }>('PUT', 'support-hours', undefined, hours)
  },
  listSales() {
    return call<AdminSalesReport>('GET', 'sales')
  },
  async listProducts() {
    return (await call<{ products: AdminProduct[] }>('GET', 'products')).products
  },
  createGrant(input: NewGrantInput) {
    return call<CreateGrantResult>('POST', 'grants', undefined, input)
  },
  async revokeGrant(id: string) {
    return (await call<{ grant: AdminGrant }>('PATCH', 'grants', undefined, { id, action: 'revoke' })).grant
  },
  async giveLicense(userId: string, productId: string) {
    return (await call<{ license: AdminLicense }>('POST', 'licenses', undefined, { userId, productId })).license
  },
  async updateLicense(id: string, action: 'extend' | 'end' | 'restore', expiresAt?: string) {
    return (await call<{ license: AdminLicense }>('PATCH', 'licenses', undefined, { id, action, expiresAt })).license
  },
}
