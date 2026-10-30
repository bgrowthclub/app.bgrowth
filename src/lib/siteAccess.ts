// What stays reachable while the site is closed before launch (Admin → Site,
// Sprint 90; released member pages, Sprint 145). One list for the browser's
// SiteGate. api/ingles.ts keeps a copy of the same rule (functions there
// import nothing from src/) — change both together.
//
// This is NOT protection against reading data: published member pages,
// products, articles and site texts are still readable straight from
// Supabase with the public key until the database rules change (Layer B).

// These addresses (and everything under them) stay open: signing in, legal
// pages, newsletter links, public tool links and Bruno's course. /register
// stays closed (decided 23/10/2026).
// Member pages open while closed — released pages and BGrowth Demos
// (member_pages.is_demo, Portal migration 0067, applied 24/10/2026; Bruno's
// and Gika's pages are demos) — come from api/ingles.ts?action=site, never
// from this list (their fixed addresses were removed on 24/10/2026).
export const ALWAYS_OPEN_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/newsletter',
  '/privacy',
  '/terms',
  '/refund-policy',
  // The Knowledge hub (30/10/2026): articles are what brings people in from
  // search before launch, so the whole section opens — the list and every
  // article. An article is free unless the team marks it (Portal migration
  // 0072), because the gate would send a visitor to /register, which stays
  // closed.
  '/knowledge',
  // Public tool links shared on Etsy, Pinterest… (Sprint 120) must keep working.
  '/t',
  // The "Inglês de Mudança" course lives under /p/bruno/ingles-de-mudanca
  // (decided 14/10/2026); /p/bruno itself redirects to Bruno's page.
  '/p/bruno',
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
