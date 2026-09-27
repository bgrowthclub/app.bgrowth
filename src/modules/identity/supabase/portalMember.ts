import type { User as AuthUser } from '@supabase/supabase-js'
import type { User } from '../types/user'
import { DEFAULT_ACHIEVEMENTS, DEFAULT_PREFERENCES, DEFAULT_SETTINGS, DEFAULT_WORKSPACE_PREFERENCES } from '../defaults'
import type { PortalClient } from './supabaseClient'

// Row shapes read from the Portal's `portal` schema — only the columns this
// file selects. The Portal repository (src/types/database.ts,
// supabase/migrations/) stays the source of truth for the full schema.
interface ProfileRow {
  full_name: string | null
  created_at: string
}

interface LicenseRow {
  status: 'active' | 'expired' | 'revoked'
  access_policy: 'expiring' | 'lifetime'
  expires_at: string | null
  products: { slug: string } | null
}

interface AccessGrantRow {
  expires_at: string | null
  revoked_at: string | null
  products: { slug: string } | null
}

function notExpired(expiresAt: string | null, now: number) {
  return expiresAt === null || new Date(expiresAt).getTime() > now
}

// Slugs of every product this member can open right now — the same rule as
// the Portal's portal.has_workspace_access(): an active, unexpired license
// (trial or purchase) OR an active, unexpired manual access grant.
async function loadOwnedProductSlugs(supabase: PortalClient, userId: string): Promise<string[]> {
  const [licenses, grants] = await Promise.all([
    supabase.from('licenses').select('status, access_policy, expires_at, products(slug)').eq('user_id', userId),
    supabase
      .from('access_grants')
      .select('expires_at, revoked_at, products(slug)')
      .eq('user_id', userId)
      .eq('scope', 'specific'),
  ])
  if (licenses.error) throw licenses.error
  if (grants.error) throw grants.error

  const now = Date.now()
  const slugs = new Set<string>()
  for (const row of (licenses.data ?? []) as unknown as LicenseRow[]) {
    const live = row.status === 'active' && (row.access_policy === 'lifetime' || notExpired(row.expires_at, now))
    if (live && row.products) slugs.add(row.products.slug)
  }
  for (const row of (grants.data ?? []) as unknown as AccessGrantRow[]) {
    if (row.revoked_at === null && notExpired(row.expires_at, now) && row.products) slugs.add(row.products.slug)
  }
  return Array.from(slugs)
}

async function loadProfile(supabase: PortalClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('users').select('full_name, created_at').eq('id', userId).maybeSingle()
  if (error) throw error
  return data as ProfileRow | null
}

// Builds BGrowth Identity™'s User from a real Supabase account. Profile and
// ownership are read best-effort: if either read fails the member is still
// signed in, just with nothing owned shown yet.
export async function loadPortalMember(supabase: PortalClient, authUser: AuthUser): Promise<User> {
  const [profile, ownedProducts] = await Promise.all([
    loadProfile(supabase, authUser.id).catch(() => null),
    loadOwnedProductSlugs(supabase, authUser.id).catch(() => [] as string[]),
  ])

  const email = authUser.email ?? ''
  const metadataName = typeof authUser.user_metadata?.full_name === 'string' ? authUser.user_metadata.full_name : ''
  const displayName = (profile?.full_name || metadataName || email.split('@')[0] || 'Member').trim()
  const [firstName, ...lastNameParts] = displayName.split(' ')

  return {
    id: authUser.id,
    email,
    displayName,
    firstName,
    lastName: lastNameParts.join(' ') || undefined,
    membership: 'free',
    language: 'en',
    preferences: DEFAULT_PREFERENCES,
    workspace: DEFAULT_WORKSPACE_PREFERENCES,
    achievements: DEFAULT_ACHIEVEMENTS,
    rewards: 0,
    benefits: [],
    ownedProducts,
    createdProducts: [],
    favoriteProducts: [],
    progress: [],
    settings: DEFAULT_SETTINGS,
    createdAt: profile?.created_at ?? authUser.created_at,
    updatedAt: authUser.updated_at ?? authUser.created_at,
  }
}
