import { Navigate } from 'react-router-dom'

// My Profile is a tab of Settings since 20/11/2026 (Sprint 313); the old
// address keeps working.
export default function ProfilePage() {
  return <Navigate to="/platform/settings" replace />
}
