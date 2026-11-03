import { supabase } from '../identity/supabase/supabaseClient'
import type { CertificateKind } from './types'

// BGrowth Academy™ certificates (02/11/2026).
//
// Issuing is decided on the SERVER, never here: this only asks. The browser
// saying "I finished" would be the browser handing itself a certificate.

export interface CertificateRow {
  code: string
  student_name: string
  course_name: string
  kind: CertificateKind
  hours: number | null
  issued_at: string
  revoked_at: string | null
  product_id: string
}

/** What the member is still missing, when the course isn't finished yet. */
export interface CertificatePending {
  lessonsLeft: number
  questionsLeft: number
}

async function call<T>(method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (!session) throw new Error('Sign in to continue.')
  const response = await fetch('/api/account?resource=certificates', {
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

export const certificateService = {
  /** Every certificate this member holds, newest first. */
  async mine() {
    return (await call<{ certificates: CertificateRow[] }>('GET')).certificates
  },

  /**
   * Asks for the certificate of one course. Returns the certificate when the
   * course is finished (the same one every time — a second request never
   * mints a second number), or what is still missing.
   */
  async claim(productId: string) {
    return await call<{ certificate: CertificateRow | null; issued: boolean; lessonsLeft?: number; questionsLeft?: number }>(
      'POST',
      { productId },
    )
  },

  /**
   * The public check. Reads portal.verify_certificate, which returns only
   * what is already printed on the certificate the asker is holding.
   */
  async verify(code: string) {
    if (!supabase) throw new Error('This isn’t available right now.')
    const { data, error } = await supabase.rpc('verify_certificate', { p_code: code })
    if (error) throw new Error(error.message)
    const row = (Array.isArray(data) ? data[0] : data) as
      | { code: string; student_name: string; course_name: string; kind: CertificateKind; hours: number | null; issued_at: string; revoked: boolean }
      | undefined
    return row ?? null
  },
}
