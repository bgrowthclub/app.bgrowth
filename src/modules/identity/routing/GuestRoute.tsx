import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useIdentity } from '../IdentityContext'

interface Props {
  children: ReactNode
}

// The inverse of ProtectedRoute — /login, /register, /forgot-password, and
// /reset-password should redirect an already-authenticated member away
// instead of showing the form again. This is the single place that
// decision is made (not each page's own effect) so a fresh Register and an
// existing Login can't race each other over where to go: an unverified
// member (fresh registration) goes to /verify-email; a verified member
// goes straight into Workspace.
export default function GuestRoute({ children }: Props) {
  const { status, emailVerified } = useIdentity()
  const { search } = useLocation()

  if (status === 'loading') return null

  if (status === 'authenticated') {
    // ?next=/some/page (e.g. a members-only article) sends the member back
    // there; only paths of this site.
    const next = new URLSearchParams(search).get('next')
    const back = next && next.startsWith('/') && !next.startsWith('//') ? next : null
    return <Navigate to={emailVerified ? back ?? '/platform/dashboard' : '/verify-email'} replace />
  }

  return <>{children}</>
}
