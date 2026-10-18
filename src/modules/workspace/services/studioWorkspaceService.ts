import { supabase } from '../../identity/supabase/supabaseClient'
import type {
  PortalAccessGrantRow,
  PortalBundleItemRow,
  PortalCatalogRow,
  PortalCategoryRow,
  PortalLicenseRow,
  PortalProductRow,
  PortalReviewRow,
  PortalReviewSummary,
  ProductGallery,
  ReviewInput,
  WorkspaceInstanceRow,
  WorkspaceOutlineSection,
} from '../types/portal'
import type { WorkspaceContent } from '../types/content'

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

// Every products column except `content`. The Workspace JSON isn't readable
// from the browser (Portal migration 0034/0035): a member with access gets
// it from portal.get_workspace_content(); visitors get only the outline.
const PRODUCT_COLUMNS =
  'id, slug, name, short_description, cover_image_url, category_id, is_trial_eligible, trial_duration, content_type, metadata, status, welcome_pdf_url, is_free, price_cents, currency, last_published_at, created_at'

type ProductRowWithoutContent = Omit<PortalProductRow, 'content'>

const withoutContent = (rows: unknown): PortalProductRow[] =>
  ((rows ?? []) as ProductRowWithoutContent[]).map((row) => ({ ...row, content: null }))

// The function isn't there yet (0034 not run) — fall back to the old column read.
function isMissingFunction(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST202' || error?.code === '42883'
}

// The full Workspace JSON, or null without access (or signed out).
async function getContent(productId: string): Promise<WorkspaceContent | null> {
  const { data, error } = await client().rpc('get_workspace_content', { p_product_id: productId })
  if (!error) return (data as WorkspaceContent | null) ?? null
  if (isMissingFunction(error)) {
    const legacy = await client().from('products').select('content').eq('id', productId).maybeSingle()
    return ((legacy.data as { content?: WorkspaceContent | null } | null)?.content ?? null)
  }
  return null
}

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

  // Published bundles (Portal migration 0041) and what each one includes.
  // Before that migration runs there are simply no bundles.
  async listBundles(): Promise<{ bundles: PortalProductRow[]; items: PortalBundleItemRow[] }> {
    const { data, error } = await client()
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('content_type', 'bundle')
      .eq('status', 'published')
      .order('last_published_at', { ascending: false, nullsFirst: false })
    if (error) throw error
    const bundles = withoutContent(data)
    if (bundles.length === 0) return { bundles, items: [] }
    const itemsResult = await client()
      .from('bundle_items')
      .select('bundle_id, product_id, sort_order')
      .in('bundle_id', bundles.map((b) => b.id))
      .order('sort_order')
    if (itemsResult.error) throw itemsResult.error
    return { bundles, items: (itemsResult.data ?? []) as PortalBundleItemRow[] }
  },

  // Every product's tags (Portal migration 0048, public read): one row
  // per product with the tag names. Empty when the table isn't there yet.
  async listProductTags(): Promise<{ productId: string; tags: string[] }[]> {
    const { data, error } = await client().from('product_tags').select('product_id, tags(name)')
    if (error) return []
    const byProduct = new Map<string, string[]>()
    for (const row of (data ?? []) as unknown as { product_id: string; tags: { name: string } | { name: string }[] | null }[]) {
      const list = Array.isArray(row.tags) ? row.tags : row.tags ? [row.tags] : []
      const names = byProduct.get(row.product_id) ?? []
      names.push(...list.map((t) => t.name))
      byProduct.set(row.product_id, names)
    }
    return Array.from(byProduct, ([productId, tags]) => ({ productId, tags }))
  },

  // A product's gallery (Portal migration 0050) by its Portal id; null when
  // it has none (or the column isn't there yet).
  async getProductGallery(productId: string): Promise<ProductGallery | null> {
    const { data, error } = await client().from('products').select('gallery').eq('id', productId).maybeSingle()
    if (error || !data) return null
    const g = ((data as { gallery?: Partial<ProductGallery> | null }).gallery ?? {}) as Partial<ProductGallery>
    const images = Array.isArray(g.images) ? g.images.filter((u): u is string => typeof u === 'string' && u.startsWith('https://')).slice(0, 6) : []
    const video = g.video && typeof g.video.url === 'string' && g.video.url.startsWith('https://') ? g.video : null
    return images.length || video ? { images, video } : null
  },

  async listCategories(): Promise<PortalCategoryRow[]> {
    const { data, error } = await client().from('workspace_categories').select('*')
    if (error) throw error
    return (data ?? []) as PortalCategoryRow[]
  },

  // Product row with its content JSON when the signed-in member has access
  // (null otherwise). RLS returns an archived product only to a member who
  // owns it.
  async getProductBySlug(slug: string): Promise<PortalProductRow | null> {
    // A list query (not maybeSingle) so a repeated slug can't turn into an
    // error — the most recently published one wins.
    const { data, error } = await client()
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('slug', slug)
      .order('last_published_at', { ascending: false, nullsFirst: false })
      .limit(1)
    if (error) throw error
    const row = withoutContent(data)[0]
    if (!row) return null
    return { ...row, content: await getContent(row.id) }
  },

  // Product rows without content; pass withContent for the ones the member
  // has access to (e.g. My Documents' progress).
  async getProductsByIds(ids: string[], options: { withContent?: boolean } = {}): Promise<PortalProductRow[]> {
    if (ids.length === 0) return []
    const { data, error } = await client().from('products').select(PRODUCT_COLUMNS).in('id', ids)
    if (error) throw error
    const rows = withoutContent(data)
    if (!options.withContent) return rows
    return Promise.all(rows.map(async (row) => ({ ...row, content: await getContent(row.id) })))
  },

  async listPublishedProducts(): Promise<PortalProductRow[]> {
    const { data, error } = await client().from('products').select(PRODUCT_COLUMNS).eq('status', 'published')
    if (error) throw error
    return withoutContent(data)
  },

  // The public outline of a published Workspace — section titles only.
  async getOutline(slug: string): Promise<WorkspaceOutlineSection[]> {
    const { data, error } = await client().rpc('get_workspace_outline', { p_slug: slug })
    if (!error) return (data as WorkspaceOutlineSection[] | null) ?? []
    if (isMissingFunction(error)) {
      const row = await this.getProductBySlug(slug)
      return (row?.content?.sections ?? []).map((section) => ({
        id: section.id,
        number: section.number ?? null,
        type: section.type,
        title: section.title,
        description: section.description ?? '',
        icon: section.icon ?? '',
        optional: section.optional ?? null,
      }))
    }
    return []
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

  // The lowest plan that includes this product (Portal migration 0061), or
  // null — shown on the product page. Public read.
  async getIncludedPlan(productId: string): Promise<string | null> {
    const { data, error } = await client()
      .from('product_plan_access')
      .select('membership_plans(name, status)')
      .eq('product_id', productId)
      .maybeSingle()
    if (error || !data) return null
    const plan = (data as unknown as { membership_plans: { name: string; status: string } | null }).membership_plans
    return plan && plan.status !== 'disabled' ? plan.name : null
  },

  // The member's access grants, plus what their plan includes as grant-like
  // rows (`via_plan`), so every access check counts plans the same way the
  // database's has_workspace_access() does (Portal migration 0061).
  async listAccessGrants(userId: string): Promise<PortalAccessGrantRow[]> {
    const { data, error } = await client()
      .from('access_grants')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    const grants = (data ?? []) as PortalAccessGrantRow[]
    const { data: included, error: planError } = await client().rpc('plan_included_products')
    if (planError || !Array.isArray(included)) return grants
    const now = new Date().toISOString()
    for (const row of included as { product_id: string | null; plan_name: string | null; includes_all: boolean }[]) {
      grants.push({
        scope: row.includes_all ? 'all' : 'specific',
        product_id: row.includes_all ? null : row.product_id,
        expires_at: null,
        revoked_at: null,
        created_at: now,
        via_plan: row.plan_name ?? 'your plan',
      })
    }
    return grants
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

  // --- Reviews (Portal migration 0009: portal.reviews) ---------------------
  // Public to read. Writing needs a license row for the product (any
  // status, so a review survives an expired trial) — RLS enforces it.

  async listReviews(productId: string): Promise<PortalReviewRow[]> {
    const { data, error } = await client()
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as PortalReviewRow[]
  },

  // Every product's star average in one query — for the catalog cards.
  async listReviewSummaries(): Promise<Record<string, PortalReviewSummary>> {
    const { data, error } = await client()
      .from('product_review_summary')
      .select('product_id, average_rating, review_count')
    if (error) throw error
    const rows = (data ?? []) as { product_id: string; average_rating: number | string | null; review_count: number }[]
    return Object.fromEntries(
      rows.map((r) => [r.product_id, { averageRating: Number(r.average_rating ?? 0), reviewCount: r.review_count ?? 0 }]),
    )
  },

  async getReviewSummary(productId: string): Promise<PortalReviewSummary> {
    const { data, error } = await client()
      .from('product_review_summary')
      .select('average_rating, review_count')
      .eq('product_id', productId)
      .maybeSingle()
    if (error) throw error
    const row = data as { average_rating: number | string | null; review_count: number } | null
    return { averageRating: Number(row?.average_rating ?? 0), reviewCount: row?.review_count ?? 0 }
  },

  // The member's license for one product, if any — what makes them able to review it.
  async getLicense(userId: string, productId: string): Promise<PortalLicenseRow | null> {
    const { data, error } = await client()
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .limit(1)
    if (error) throw error
    return ((data ?? [])[0] as PortalLicenseRow | undefined) ?? null
  },

  async createReview(
    userId: string,
    productId: string,
    displayName: string,
    createdFrom: PortalReviewRow['created_from'],
    input: ReviewInput,
  ): Promise<PortalReviewRow> {
    const { data, error } = await client()
      .from('reviews')
      .insert({
        user_id: userId,
        product_id: productId,
        display_name: displayName,
        created_from: createdFrom,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
      })
      .select()
      .single()
    if (error) throw error
    return data as PortalReviewRow
  },

  async updateReview(reviewId: string, input: ReviewInput): Promise<PortalReviewRow> {
    const { data, error } = await client()
      .from('reviews')
      .update({ rating: input.rating, title: input.title, comment: input.comment, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .select()
      .single()
    if (error) throw error
    return data as PortalReviewRow
  },
}
