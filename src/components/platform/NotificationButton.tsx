import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import Popover from './Popover'
import EmptyState from '../ui/EmptyState'
import { useIdentity } from '../../modules/identity/IdentityContext'
import {
  announcementDate,
  getAnnouncementsSeenAt,
  getBellAnnouncements,
  markAnnouncementsSeen,
} from '../../modules/site/siteService'
import type { SiteAnnouncement } from '../../modules/site/types'

function when(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// The member area's bell (Sprint 80): the latest notices the team marked
// "bell" in Admin → Site (Portal migration 0046). A dot shows notices newer
// than the last time this member opened it; opening it marks them seen on
// the account, so it holds on every device.
export default function NotificationButton() {
  const { user } = useIdentity()
  const [items, setItems] = useState<SiteAnnouncement[]>([])
  const [seenAt, setSeenAt] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    Promise.all([getBellAnnouncements(), getAnnouncementsSeenAt(user.id)])
      .then(([list, seen]) => {
        if (cancelled) return
        setItems(list)
        setSeenAt(seen)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [user])

  const isNew = (a: SiteAnnouncement) => !seenAt || announcementDate(a) > seenAt
  const unread = items.some(isNew)

  return (
    <Popover
      panelClassName="w-80 p-3 max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto"
      trigger={({ open, toggle }) => (
        <button
          onClick={() => {
            if (!open && unread) {
              void markAnnouncementsSeen()
              // Seen on the account now; the "new" marks stay a few seconds
              // so the member can spot them.
              window.setTimeout(() => setSeenAt(new Date().toISOString()), 4000)
            }
            toggle()
          }}
          aria-label={unread ? 'Notifications (new)' : 'Notifications'}
          aria-haspopup="true"
          aria-expanded={open}
          className="relative grid h-9 w-9 place-items-center rounded-full text-navy/50 transition-colors hover:bg-bg-soft hover:text-navy"
        >
          <Bell size={17} strokeWidth={2} />
          {unread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
        </button>
      )}
    >
      <p className="px-1 pb-2 text-[13px] font-semibold text-navy">Notifications</p>
      {items.length === 0 ? (
        <EmptyState title="You're all caught up." description="New activity will show up here." />
      ) : (
        <ul className="max-h-96 space-y-1 overflow-y-auto">
          {items.map((a) => (
            <li key={a.id} className="rounded-xl px-2 py-2 hover:bg-bg-soft">
              <div className="flex items-start gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isNew(a) ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-navy">{a.title}</p>
                  {a.body && <p className="mt-0.5 text-[12.5px] text-navy/60">{a.body}</p>}
                  <div className="mt-1 flex items-center gap-3 text-[12px]">
                    <span className="text-navy/40">{when(announcementDate(a))}</span>
                    {a.link_url &&
                      (a.link_url.startsWith('/') ? (
                        <Link to={a.link_url} className="font-semibold text-primary">
                          {a.link_label || 'Learn more'} →
                        </Link>
                      ) : (
                        <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary">
                          {a.link_label || 'Learn more'} →
                        </a>
                      ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  )
}
