import type { User } from '../identity/types/user'

// The Admin area's two roles (Portal migration 0042). Admins see and do
// everything; Support works with members: Support, Members (view, resend
// confirmation, give or extend access and trials) and reading Reviews.
// This only shapes the UI — api/admin.ts enforces the same rule on every
// request (SUPPORT_ACTIONS there).
export type AdminRole = 'admin' | 'support'

export const SUPPORT_HOME = '/platform/admin/support'

export function adminRoleOf(user: User | null | undefined): AdminRole | null {
  if (!user?.isAdmin) return null
  return user.adminRole ?? 'admin'
}

export function isFullAdmin(user: User | null | undefined) {
  return adminRoleOf(user) === 'admin'
}
