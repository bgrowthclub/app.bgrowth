import { supabase } from '../identity/supabase/supabaseClient'
import { emptyProgress } from './progress'
import type { JourneyProgressData } from './progress'
import type { JourneyAction, JourneyActionKind, JourneyActionRef, JourneyOutline, JourneyResourceState, JourneyStage, JourneySummary } from './types'

// Every read this site makes of BGrowth Journeys (Portal migration 0066).
// Journey rows themselves are hidden from browsers by row-level security;
// the only way in is these two security-definer functions, which return
// PUBLISHED Journeys only and never the name, slug, id or price of a
// resource that isn't published. Pages never call Supabase directly — they
// go through this file.
//
// Everything coming back is still treated as untrusted: unknown values are
// dropped, links must be https, images must be https.

function client() {
  if (!supabase) throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  return supabase
}

// The functions aren't there yet (migration 0066 not run): no Journeys,
// rather than an error page.
function isMissingFunction(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST202' || error?.code === '42883'
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

/** An https address, or null (a Journey only links to secure pages). */
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('https://')) return null
  try {
    return new URL(value).protocol === 'https:' ? value : null
  } catch {
    return null
  }
}

const KINDS: JourneyActionKind[] = ['product', 'article', 'video', 'link', 'manual']
const STATES: JourneyResourceState[] = ['available', 'coming_soon', 'unavailable']

interface SummaryRow {
  id: string
  slug: string
  name: string
  short_description: string | null
  cover_image_url: string | null
  category_id: string | null
  is_free: boolean
  published_at: string | null
  stage_count: number | null
}

export function toSummary(row: SummaryRow): JourneySummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? '',
    coverImageUrl: safeHttpsUrl(row.cover_image_url),
    categoryId: row.category_id ?? null,
    isFree: row.is_free === true,
    publishedAt: row.published_at ?? null,
    stageCount: Number(row.stage_count ?? 0),
  }
}

function toRef(kind: JourneyActionKind, state: JourneyResourceState, raw: unknown): JourneyActionRef {
  if (state !== 'available' || !raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (kind === 'product' && typeof r.productId === 'string' && typeof r.slug === 'string') {
    return {
      productId: r.productId,
      slug: r.slug,
      name: str(r.name),
      contentType: str(r.contentType),
      isFree: r.isFree === true,
      priceCents: typeof r.priceCents === 'number' ? r.priceCents : null,
      currency: strOrNull(r.currency),
      coverImageUrl: safeHttpsUrl(r.coverImageUrl),
    }
  }
  if (kind === 'article' && typeof r.slug === 'string') {
    return { slug: r.slug, title: str(r.title), access: str(r.access) || 'members', requiredPlanName: strOrNull(r.requiredPlanName) }
  }
  if ((kind === 'video' || kind === 'link') && safeHttpsUrl(r.url)) return { url: r.url as string }
  return null
}

function toAction(raw: unknown): JourneyAction | null {
  if (!raw || typeof raw !== 'object') return null
  const a = raw as Record<string, unknown>
  const kind = KINDS.includes(a.kind as JourneyActionKind) ? (a.kind as JourneyActionKind) : null
  const id = str(a.id)
  if (!kind || !id) return null
  let state = STATES.includes(a.state as JourneyResourceState) ? (a.state as JourneyResourceState) : 'unavailable'
  const ref = toRef(kind, state, a.ref)
  // A resource action said to be available but without a usable reference
  // (e.g. a link that isn't https) can't be opened.
  if (state === 'available' && kind !== 'manual' && !ref) state = 'unavailable'
  return {
    id,
    title: str(a.title),
    instructions: str(a.instructions),
    optional: a.optional === true,
    kind,
    state,
    ref,
    states: Array.isArray(a.states) ? a.states.filter((s): s is string => typeof s === 'string' && /^[A-Z]{2}$/.test(s)) : [],
  }
}

export function toOutline(raw: unknown): JourneyOutline | null {
  if (!raw || typeof raw !== 'object') return null
  const j = raw as Record<string, unknown>
  if (typeof j.id !== 'string' || typeof j.slug !== 'string') return null
  const stages: JourneyStage[] = (Array.isArray(j.stages) ? j.stages : [])
    .map((s): JourneyStage | null => {
      if (!s || typeof s !== 'object') return null
      const st = s as Record<string, unknown>
      const actions = (Array.isArray(st.actions) ? st.actions : []).map(toAction).filter((a): a is JourneyAction => a !== null)
      return str(st.id) ? { id: str(st.id), title: str(st.title), summary: str(st.summary), actions } : null
    })
    .filter((s): s is JourneyStage => s !== null && s.actions.length > 0)
  return {
    id: j.id,
    slug: j.slug,
    name: str(j.name),
    shortDescription: str(j.shortDescription),
    coverImageUrl: safeHttpsUrl(j.coverImageUrl),
    categoryId: strOrNull(j.categoryId),
    isFree: j.isFree === true,
    publishedAt: strOrNull(j.publishedAt),
    goal: str(j.goal),
    intro: str(j.intro),
    completionMessage: str(j.completionMessage),
    notice: str(j.notice),
    validatedStates: Array.isArray(j.validatedStates) ? j.validatedStates.filter((s): s is string => typeof s === 'string') : [],
    stages,
  }
}

export const journeyService = {
  /** The published Journeys, newest first. */
  async listJourneys(): Promise<JourneySummary[]> {
    const { data, error } = await client().rpc('list_journeys')
    if (error) {
      if (isMissingFunction(error)) return []
      throw error
    }
    // Only free Journeys can be started today (paid ones aren't built), so
    // only those are listed.
    return ((data ?? []) as SummaryRow[]).map(toSummary).filter((j) => j.isFree)
  },

  /** One published Journey with its references resolved, or null (not published / not found). */
  async getOutline(slug: string): Promise<JourneyOutline | null> {
    const { data, error } = await client().rpc('get_journey_outline', { p_slug: slug })
    if (error) {
      if (isMissingFunction(error)) return null
      throw error
    }
    return toOutline(data)
  },

  // --- A member's progress (portal.workspace_instances, data.kind 'journey') ---
  // The database allows: reading/updating only your own rows; creating one
  // only for a published, free Journey, marked 'journey', and only one per
  // member and Journey (Portal migration 0066). No license is involved.

  /** The member's progress record for this Journey, or null (not started). */
  async getProgress(userId: string, journeyId: string): Promise<JourneyProgressRecord | null> {
    const { data, error } = await client()
      .from('workspace_instances')
      .select('id, user_id, product_id, data, status, updated_at')
      .eq('user_id', userId)
      .eq('product_id', journeyId)
    if (error) throw error
    const row = ((data ?? []) as JourneyProgressRecord[]).find((r) => (r.data as { kind?: unknown } | null)?.kind === 'journey')
    return row ?? null
  },

  /** Starts the Journey — or, if it was already started (e.g. in another tab), returns that record. */
  async startJourney(userId: string, journey: { id: string; name: string }): Promise<JourneyProgressRecord> {
    const { data, error } = await client()
      .from('workspace_instances')
      .insert({ user_id: userId, product_id: journey.id, label: journey.name.slice(0, 200) || 'Journey', data: emptyProgress(), status: 'in_progress' })
      .select('id, user_id, product_id, data, status, updated_at')
      .single()
    if (!error) return data as JourneyProgressRecord
    // 23505: one record per member and Journey already exists — resume it.
    if (error.code === '23505') {
      const existing = await journeyService.getProgress(userId, journey.id)
      if (existing) return existing
    }
    throw error
  },

  /** Saves the whole progress (only the member's own row — RLS). */
  async saveProgress(recordId: string, progress: JourneyProgressData, complete: boolean): Promise<void> {
    const { data, error } = await client()
      .from('workspace_instances')
      .update({ data: progress, status: complete ? 'completed' : 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', recordId)
      .select('id')
    if (error) throw error
    if (!data || data.length === 0) throw new Error('Couldn’t save your progress — please reload the page.')
  },
}

export interface JourneyProgressRecord {
  id: string
  user_id: string
  product_id: string
  data: unknown
  status: 'in_progress' | 'completed' | 'archived'
  updated_at: string
}
