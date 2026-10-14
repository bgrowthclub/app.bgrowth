import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { getSiteOpen } from '../../modules/site/siteService'
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
  '/p/bruno', // Bruno's page and the "Inglês de Mudança" course (decided 14/10/2026)
  '/ingles-de-mudanca',
]

export default function SiteGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { status, user } = useIdentity()
  const [open, setOpen] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    void getSiteOpen().then((value) => {
      if (!cancelled) setOpen(value)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return <>{children}</>
  if (open === null || status === 'loading') return null
  if (open || user?.isAdmin) return <>{children}</>
  return <ComingSoonPage />
}
