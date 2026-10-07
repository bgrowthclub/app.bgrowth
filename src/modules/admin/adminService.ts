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
  NewGrantInput, AdminCatalogCategories, AdminCategory,
  AdminNewsletterCampaign, AdminNewsletterDraft, AdminNewsletterOverview, AdminReview, AdminMemberDashboard, DashboardPeriod } from './types'
import type { SupportHours } from '../support/types'

// The browser side of the Website's Administration — every call goes to
// api/admin.ts with the signed-in admin's access token. Nothing here talks
// to the database directly: admin writes need the service role, which only
// the server has.

async function call<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', resource: string, params?: Record<string, string>, body?: unknown): Promise<T> {
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
  async countSupportWaiting() {
    return (await call<{ waiting: number }>('GET', 'support-waiting')).waiting
  },
  listCategories() {
    return call<AdminCatalogCategories>('GET', 'categories')
  },
  async createCategory(name: string, parentId: string) {
    return (await call<{ category: AdminCategory }>('POST', 'categories', undefined, { name, parentId })).category
  },
  async updateCategory(id: string, patch: { name?: string; parentId?: string }) {
    return (await call<{ category: AdminCategory }>('PATCH', 'categories', undefined, { id, ...patch })).category
  },
  async deleteCategory(id: string) {
    await call('DELETE', 'categories', undefined, { id })
  },
  async setProductCategory(productId: string, categoryId: string | null) {
    await call('PATCH', 'product-category', undefined, { productId, categoryId })
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
  getNewsletter() {
    return call<AdminNewsletterOverview>('GET', 'newsletter')
  },
  async getNewsletterCampaign(id: string) {
    return (await call<{ campaign: AdminNewsletterCampaign }>('GET', 'newsletter-campaign', { id })).campaign
  },
  async saveNewsletterCampaign(draft: AdminNewsletterDraft) {
    return (await call<{ campaign: AdminNewsletterCampaign }>('POST', 'newsletter-campaign', undefined, draft)).campaign
  },
  async deleteNewsletterCampaign(id: string) {
    await call('DELETE', 'newsletter-campaign', undefined, { id })
  },
  getMemberDashboard(period: DashboardPeriod) {
    return call<AdminMemberDashboard>('GET', 'dashboard-members', { period })
  },
  async listReviews() {
    return (await call<{ reviews: AdminReview[] }>('GET', 'reviews')).reviews
  },
  async removeReview(id: string) {
    await call('DELETE', 'reviews', undefined, { id })
  },
  async createLaunchCampaign(productId: string) {
    return (await call<{ campaign: AdminNewsletterCampaign }>('POST', 'newsletter-launch', undefined, { productId })).campaign
  },
  async uploadNewsletterImage(dataUrl: string) {
    return (await call<{ url: string }>('POST', 'newsletter-image', undefined, { dataUrl })).url
  },
  async previewNewsletter(draft: Pick<AdminNewsletterDraft, 'subject' | 'preheader' | 'bodyHtml'>) {
    return (await call<{ html: string }>('POST', 'newsletter-preview', undefined, draft)).html
  },
  async countNewsletterAudience(areas: string[]) {
    return (await call<{ count: number }>('GET', 'newsletter-audience', { areas: areas.join(',') })).count
  },
  async sendNewsletterTest(id: string) {
    return (await call<{ sentTo: string }>('POST', 'newsletter-test', undefined, { id })).sentTo
  },
  async sendNewsletter(id: string) {
    return (await call<{ sent: number }>('POST', 'newsletter-send', undefined, { id })).sent
  },
  async saveNewsletterAddress(address: string) {
    return (await call<{ address: string }>('PUT', 'newsletter-address', undefined, { address })).address
  },
}
