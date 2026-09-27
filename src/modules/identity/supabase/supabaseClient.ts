import { createClient } from '@supabase/supabase-js'

// The browser Supabase client — the same project, the same `portal`
// schema and the same accounts as BGrowth Portal (e-mail is the identity:
// one account works on both). Only the public anon key lives here; every
// table it touches is protected by the Portal's row-level security.
//
// Set in Vercel (Project → Settings → Environment Variables), same values
// as the Portal project:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//
// Without them the site still renders; sign-in simply reports that it
// isn't available (see SupabaseIdentityProvider) instead of crashing.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function createPortalClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'portal' },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
}

export type PortalClient = ReturnType<typeof createPortalClient>

export const supabase: PortalClient | undefined = url && anonKey ? createPortalClient(url, anonKey) : undefined
