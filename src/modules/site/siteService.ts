import { supabase } from '../identity/supabase/supabaseClient'
import type { SiteAnnouncement, SiteContentRow } from './types'

// Reads what is live (row-level security only returns active notices inside
// their dates). Writes go through api/admin.ts; "seen" through api/account.ts.
// Before Portal migration 0046 runs there is simply nothing to show.
const missing = (code?: string) => code === '42P01' || code === 'PGRST205' || code === '42703'

async function liveAnnouncements(column: 'show_banner' | 'show_bell', limit: number): Promise<SiteAnnouncement[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('site_announcements')
    .select('*')
    .eq(column, true)
    .order('starts_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    if (missing(error.code)) return []
    throw error
  }
  return (data ?? []) as SiteAnnouncement[]
}

// The newest notice for the bar at the top of the public site.
export async function getBannerAnnouncement(): Promise<SiteAnnouncement | null> {
  return (await liveAnnouncements('show_banner', 1))[0] ?? null
}

// The latest notices for the bell in the member area.
export function getBellAnnouncements(): Promise<SiteAnnouncement[]> {
  return liveAnnouncements('show_bell', 10)
}

// When the member last opened the bell (null = never or not available).
export async function getAnnouncementsSeenAt(userId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('users').select('announcements_seen_at').eq('id', userId).maybeSingle()
  if (error) return null
  return ((data as { announcements_seen_at?: string | null } | null)?.announcements_seen_at as string | null) ?? null
}

export async function markAnnouncementsSeen(): Promise<void> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (!session) return
  await fetch('/api/account?resource=announcements-seen', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).catch(() => undefined)
}

// The products the Home highlights, in order (empty = the Home shows the
// latest products).
export async function getHomeFeaturedIds(): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('home_featured').select('product_id').order('sort_order')
  if (error) return []
  return ((data ?? []) as { product_id: string }[]).map((r) => r.product_id)
}

// When it shows: a notice with a start date counts from then.
export function announcementDate(a: SiteAnnouncement) {
  return a.starts_at ?? a.created_at
}

// Is the site open to everyone, or "Coming soon" for all but the team?
// (Admin → Site; read through api/ingles.ts, the public function.) If the
// check fails, the site counts as closed (decided 23/10/2026, pre-launch).
// Revisit after launch: an outage would then show "Coming soon" to all.
export async function getSiteOpen(): Promise<boolean> {
  return (await getSiteAccess()).open
}

// The same, plus the member page addresses the team released before launch
// (Admin → Pages, Sprint 145).
export async function getSiteAccess(): Promise<{ open: boolean; pages: string[] }> {
  try {
    const res = await fetch('/api/ingles?action=site')
    if (!res.ok) return { open: false, pages: [] }
    const data = (await res.json()) as { open?: boolean; pages?: unknown }
    const pages = Array.isArray(data.pages) ? data.pages.filter((s): s is string => typeof s === 'string').map((s) => s.toLowerCase()) : []
    return { open: data.open === true, pages }
  } catch {
    return { open: false, pages: [] }
  }
}

// A piece of the site edited in Admin → Site (portal.site_content, English
// for now). null = not edited (or not available) — show the built-in text.
export async function getSiteContent<T>(key: string): Promise<SiteContentRow<T> | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('site_content')
    .select('value, updated_at, updated_by')
    .eq('key', key)
    .eq('locale', 'en')
    .maybeSingle()
  if (error || !data) return null
  return data as SiteContentRow<T>
}
