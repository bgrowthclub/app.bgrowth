import { Bell } from 'lucide-react'
import Popover from './Popover'
import EmptyState from '../ui/EmptyState'

// Placeholder only — there is no notification backend yet, so no unread dot
// is shown (it used to be static and suggested news that wasn't there).
export default function NotificationButton() {
  return (
    <Popover
      panelClassName="w-72 p-3 max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto"
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          aria-label="Notifications"
          aria-haspopup="true"
          aria-expanded={open}
          className="relative grid h-9 w-9 place-items-center rounded-full text-navy/50 transition-colors hover:bg-bg-soft hover:text-navy"
        >
          <Bell size={17} strokeWidth={2} />
        </button>
      )}
    >
      <p className="px-1 pb-2 text-[13px] font-semibold text-navy">Notifications</p>
      <EmptyState title="You're all caught up." description="New activity will show up here." />
    </Popover>
  )
}
