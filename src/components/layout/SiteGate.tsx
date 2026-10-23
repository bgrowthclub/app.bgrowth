import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { getSiteAccess } from '../../modules/site/siteService'
import { isAlwaysOpenPath, openWhileClosed } from '../../lib/siteAccess'
import ComingSoonPage from '../../pages/ComingSoonPage'

// Before launch the site is closed (Admin → Site): visitors and members see
// "Coming soon"; the team (portal.website_admins) sees everything. What
// stays reachable (sign-in, legal pages, released member pages…) is in
// lib/siteAccess.ts. This is a screen, not data protection: see there.

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

  if (isAlwaysOpenPath(pathname)) return <>{children}</>
  if (open === null || status === 'loading') return null
  if (open || user?.isAdmin) return <>{children}</>
  if (openWhileClosed(pathname, openPages)) return <>{children}</>
  return <ComingSoonPage />
}
