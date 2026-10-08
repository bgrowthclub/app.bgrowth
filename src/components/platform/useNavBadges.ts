import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { supportService } from '../../modules/support/supportService'
import { adminService } from '../../modules/admin/adminService'
import { usePoll } from '../../modules/support/usePoll'
import type { NavBadgeKey } from './platformNav'

export type NavBadges = Partial<Record<NavBadgeKey, number>>

// Live counts for the sidebar (platformNav's `badge`): refreshed on every
// page change and every 30 seconds while the tab is visible. A failed
// check just leaves the last count — a badge never breaks the shell.
export function useNavBadges(): NavBadges {
  const { user } = useIdentity()
  const { pathname, search } = useLocation()
  const [badges, setBadges] = useState<NavBadges>({})
  const isAdmin = Boolean(user?.isAdmin)

  const refresh = useCallback(() => {
    if (!user) return
    supportService
      .getState()
      .then((s) => setBadges((b) => ({ ...b, supportUnread: s.conversations.filter((c) => c.unread).length })))
      .catch(() => undefined)
    if (isAdmin)
      adminService
        .countWaiting()
        .then((counts) => setBadges((b) => ({ ...b, ...counts })))
        .catch(() => undefined)
  }, [user, isAdmin])

  useEffect(refresh, [refresh, pathname, search])
  usePoll(refresh, 30_000, Boolean(user))
  return badges
}
