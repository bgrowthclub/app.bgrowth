import { useState } from 'react'
import { Bell } from 'lucide-react'
import EmptyState from '../ui/EmptyState'

// Placeholder only — there is no notification backend yet. The dot is a
// static visual affordance, not tied to any real unread count.
export default function NotificationButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-full text-navy/50 transition-colors hover:bg-bg-soft hover:text-navy"
      >
        <Bell size={17} strokeWidth={2} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl2 border border-navy/[0.06] bg-white p-3 shadow-glow">
            <p className="px-1 pb-2 text-[13px] font-semibold text-navy">Notifications</p>
            <EmptyState title="You're all caught up." description="New activity will show up here." />
          </div>
        </>
      )}
    </div>
  )
}
