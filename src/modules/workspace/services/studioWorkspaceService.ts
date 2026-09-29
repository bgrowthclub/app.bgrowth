import { supabase } from '../../identity/supabase/supabaseClient'
import type {
  PortalAccessGrantRow,
  PortalCatalogRow,
  PortalCategoryRow,
  PortalLicenseRow,
  PortalProductRow,
  WorkspaceInstanceRow,
} from '../types/portal'

// Every read/write this site makes against the Studio-published Workspaces
// in the Portal's Supabase (`portal` schema). The shared browser client
// comes from BGrowth Identity™ (one session for sign-in and data); pages
// and components never call Supabase directly — they go through this file
// (or Commerce's product repository, which is built on it).
//
// Row-level security in the Portal's database is the real guard: a member
// can only read their own licenses/instances and only write instances for
// Workspaces they have access to.

function client() {
  if (!supabase) throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  return supabase
}

export const isStudioCatalogAvailable = Boolean(supabase)

export const studioWorkspaceService = {
  // The public catalog — portal.catalog_index only ever holds published
  // products (archive_product() removes a row), newest first.
  async listCatalog(): Promise<PortalCatalogRow[]> {
    const { data, error } = await client()
      .from('catalog_index')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
    if (error) throw error
    return (data ?? []) as PortalCatalogRow[]
  },

  async listCategories(): Promise<PortalCategoryRow[]> {
    const { data, error } = await client().from('workspace_categories').select('id, name, slug')
    if (error) throw error
    return (data ?? []) as PortalCategoryRow[]
  },

  // Full product row (content JSON + marketing metadata). RLS returns an
  // archived product only to a member who owns it.
  async getProductBySlug(slug: string): Promise<PortalProductRow | null> {
    // A list query (not maybeSingle) so a repeated slug can't turn into an
    // error — the most recently published one wins.
    const { data, error } = await client()
      .from('products')
      .select('*')
      .eq('slug', slug)
      .order('last_published_at', { ascending: false, nullsFirst: false })
      .limit(1)
    if (error) throw error
    return ((data ?? [])[0] as PortalProductRow | undefined) ?? null
  },

  async getProductsByIds(ids: string[]): Promise<PortalProductRow[]> {
    if (ids.length === 0) return []
    const { data, error } = await client().from('products').select('*').in('id', ids)
    if (error) throw error
    return (data ?? []) as PortalProductRow[]
  },

  async listPublishedProducts(): Promise<PortalProductRow[]> {
    const { data, error } = await client().from('products').select('*').eq('status', 'published')
    if (error) throw error
    return (data ?? []) as PortalProductRow[]
  },

  async listLicenses(userId: string): Promise<PortalLicenseRow[]> {
    const { data, error } = await client()
      .from('licenses')
      // '*' on purpose: some Portal databases don't have every column yet
      // (e.g. last_opened_at, added by the Portal's migration 0019) — asking
      // for a missing column by name fails the whole query.
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []) as PortalLicenseRow[]
  },

  async listAccessGrants(userId: string): Promise<PortalAccessGrantRow[]> {
    const { data, error } = await client()
      .from('access_grants')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []) as PortalAccessGrantRow[]
  },

  // "Recently opened" — the one self-service column (with is_favorite) a
  // member may update on their own license row. Callers only call this when
  // the license row actually has the column (see WorkspaceViewerPage).
  async recordOpened(licenseId: string): Promise<void> {
    const { error } = await client()
      .from('licenses')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', licenseId)
    if (error) throw error
  },

  // Every saved record of every Workspace — the "My Documents" list.
  async listAllInstances(userId: string): Promise<WorkspaceInstanceRow[]> {
    const { data, error } = await client()
      .from('workspace_instances')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as WorkspaceInstanceRow[]
  },

  async listInstances(userId: string, productId: string): Promise<WorkspaceInstanceRow[]> {
    const { data, error } = await client()
      .from('workspace_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as WorkspaceInstanceRow[]
  },

  async getInstance(instanceId: string): Promise<WorkspaceInstanceRow | null> {
    const { data, error } = await client().from('workspace_instances').select('*').eq('id', instanceId).limit(1)
    if (error) throw error
    return ((data ?? [])[0] as WorkspaceInstanceRow | undefined) ?? null
  },

  async createInstance(userId: string, productId: string, label: string): Promise<WorkspaceInstanceRow> {
    const { data, error } = await client()
      .from('workspace_instances')
      .insert({ user_id: userId, product_id: productId, label })
      .select()
      .single()
    if (error) throw error
    return data as WorkspaceInstanceRow
  },

  // .select() so a zero-row update (RLS filtered, stale id) surfaces as an
  // error instead of silently "succeeding".
  async saveInstanceData(instanceId: string, data: Record<string, unknown>): Promise<void> {
    const { data: rows, error } = await client()
      .from('workspace_instances')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', instanceId)
      .select('id')
    if (error) throw error
    if (!rows || rows.length === 0) throw new Error('Couldn’t save — this record is no longer available.')
  },
}
