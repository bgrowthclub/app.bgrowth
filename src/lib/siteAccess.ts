// What stays reachable while the site is closed before launch (Admin → Site,
// Sprint 90; released member pages, Sprint 145). One list for the browser's
// SiteGate. api/ingles.ts keeps a copy of the same rule (functions there
// import nothing from src/) — change both together.
//
// This is NOT protection against reading data: published member pages,
// products, articles and site texts are still readable straight from
// Supabase with the public key until the database rules change (Layer B).

// These addresses (and everything under them) stay open: signing in, legal
// pages, newsletter links, public tool links, Bruno's and Gika's pages and
// Bruno's course. /register stays closed (decided 23/10/2026).
export const ALWAYS_OPEN_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/newsletter',
  '/privacy',
  '/terms',
  '/refund-policy',
  // Public tool links shared on Etsy, Pinterest… (Sprint 120) must keep working.
  '/t',
  '/p/bruno', // Bruno's page and the "Inglês de Mudança" course (decided 14/10/2026)
  '/p/growwithbruno', // Bruno's page's address since 19/10/2026 (/p/bruno leads there)
  '/p/dicasdagigika', // decided 19/10/2026
  '/ingles-de-mudanca',
]

// "/p/<slug>" (one segment, optional trailing slash) → the slug, lowercased.
export function memberPageSlug(pathname: string): string | null {
  return /^\/p\/([^/]+)\/?$/.exec(pathname)?.[1]?.toLowerCase() ?? null
}

export function isAlwaysOpenPath(pathname: string): boolean {
  return ALWAYS_OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

// Can a visitor see this address while the site is closed? releasedSlugs =
// the member pages the team released (current and old addresses).
export function openWhileClosed(pathname: string, releasedSlugs: readonly string[]): boolean {
  if (isAlwaysOpenPath(pathname)) return true
  const slug = memberPageSlug(pathname)
  return Boolean(slug && releasedSlugs.includes(slug))
}
