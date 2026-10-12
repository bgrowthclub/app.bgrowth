import { supabase } from '../../identity/supabase/supabaseClient'

// One file of a Download the member owns (Sprint 86): api/account.ts checks
// access and returns a 2-minute link to the private file.
export async function getDownloadLink(productId: string, fileId: string): Promise<string> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (!session) throw new Error('Sign in to continue.')
  const response = await fetch(
    `/api/account?resource=download&product=${encodeURIComponent(productId)}&file=${encodeURIComponent(fileId)}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } },
  )
  const json = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string }
  if (!response.ok || !json.ok || !json.url) throw new Error(json.error ?? `Download failed (${response.status}).`)
  return json.url
}
