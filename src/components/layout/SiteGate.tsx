import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { getSiteAccess } from '../../modules/site/siteService'
import ComingSoonPage from '../../pages/ComingSoonPage'

// Before launch the site is closed (Admin → Site): visitors and members see
// "Coming soon"; the team (portal.website_admins) sees everything. These
// stay reachable so the team can sign in and shared links keep working.
const ALWAYS_OPEN = [
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

export default function SiteGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { status, user } = useIdentity()
  const [open, setOpen] = useState<boolean | null>(null)
  // Member pages the team released before launch (Admin → Pages).
  const [openPages, setOpenPages] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    void getSiteAccess().then((value) => {
      if (cancelled) return
      setOpenPages(value.pages)
      setOpen(value.open)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return <>{children}</>
  if (open === null || status === 'loading') return null
  if (open || user?.isAdmin) return <>{children}</>
  const pageSlug = /^\/p\/([^/]+)\/?$/.exec(pathname)?.[1]?.toLowerCase()
  if (pageSlug && openPages.includes(pageSlug)) return <>{children}</>
  return <ComingSoonPage />
}
