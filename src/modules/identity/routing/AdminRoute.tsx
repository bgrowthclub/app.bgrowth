import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useIdentity } from '../IdentityContext'
import { SUPPORT_HOME, adminRoleOf } from '../../admin/permissions'

interface Props {
  children: ReactNode
  // Also open to the Support role (Portal migration 0042). Without it the
  // page is for Admins only, and Support lands on the Support inbox.
  support?: boolean
}

// Gates the Website's Admin area — the role-based extension of
// ProtectedRoute that ARCHITECTURE.md anticipated. Always nested inside
// ProtectedRoute (PlatformLayout), so a guest never reaches it; a signed-in
// member who isn't an administrator goes back to their Dashboard. This is
// only the UI gate: api/admin.ts re-checks portal.website_admins (and the
// role) on every request.
export default function AdminRoute({ children, support = false }: Props) {
  const { status, user } = useIdentity()
  if (status === 'loading') return null
  const role = adminRoleOf(user)
  if (!role) return <Navigate to="/platform/dashboard" replace />
  if (role === 'support' && !support) return <Navigate to={SUPPORT_HOME} replace />
  return <>{children}</>
}
