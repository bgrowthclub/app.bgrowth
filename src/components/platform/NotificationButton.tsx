import { Bell } from 'lucide-react'
import Popover from './Popover'
import EmptyState from '../ui/EmptyState'

// Placeholder only — there is no notification backend yet. The dot is a
// static visual affordance, not tied to any real unread count.
export default function NotificationButton() {
  return (
    <Popover
      panelClassName="w-72 p-3"
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          aria-label="Notifications"
          aria-haspopup="true"
          aria-expanded={open}
          className="relative grid h-9 w-9 place-items-center rounded-full text-navy/50 transition-colors hover:bg-bg-soft hover:text-navy"
        >
          <Bell size={17} strokeWidth={2} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
      )}
    >
      <p className="px-1 pb-2 text-[13px] font-semibold text-navy">Notifications</p>
      <EmptyState title="You're all caught up." description="New activity will show up here." />
    </Popover>
  )
}
