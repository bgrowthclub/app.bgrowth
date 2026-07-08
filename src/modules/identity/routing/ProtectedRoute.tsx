import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useIdentity } from '../mock/MockIdentityProvider'

interface Props {
  children: ReactNode
}

// Gates a route behind BGrowth Identity™'s (mock) session — redirects a
// guest to /login. This is the "Protected Routes" case from Milestone 5.2;
// see ARCHITECTURE.md for how Future Role-Based/Premium/Creator/Admin/
// Enterprise routes would extend this same wrapper with a permission check
// (using FutureRoles/FuturePermissions) once those are implemented, rather
// than each inventing its own guard.
export default function ProtectedRoute({ children }: Props) {
  const { status } = useIdentity()

  // Avoid a flash of a redirect while the mock session check on mount
  // (see MockIdentityProvider) resolves.
  if (status === 'loading') return null

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
