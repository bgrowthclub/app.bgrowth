import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useIdentity } from '../IdentityContext'

interface Props {
  children: ReactNode
}

// Gates the Website's Admin area — the role-based extension of
// ProtectedRoute that ARCHITECTURE.md anticipated. Always nested inside
// ProtectedRoute (PlatformLayout), so a guest never reaches it; a signed-in
// member who isn't an administrator goes back to their Dashboard. This is
// only the UI gate: api/admin.ts re-checks portal.website_admins on every
// request.
export default function AdminRoute({ children }: Props) {
  const { status, user } = useIdentity()
  if (status === 'loading') return null
  if (!user?.isAdmin) return <Navigate to="/platform/dashboard" replace />
  return <>{children}</>
}
