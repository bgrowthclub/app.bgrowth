import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserCircle, Settings, LifeBuoy, LogOut } from 'lucide-react'

// Placeholder only — there is no session/identity yet, so the name below is
// static and Logout is purely visual (see CLAUDE.md: no auth without
// explicit direction). Settings/Support already route to real pages.
export default function UserMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-bg-soft"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-grad-primary text-white">
          <UserCircle size={18} strokeWidth={2} />
        </span>
        <span className="hidden text-[13px] font-semibold text-navy/80 sm:inline">Guest Member</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl2 border border-navy/[0.06] bg-white p-1.5 shadow-glow">
            <Link
              to="/platform/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/70 hover:bg-bg-soft"
            >
              <Settings size={15} />
              Settings
            </Link>
            <Link
              to="/platform/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/70 hover:bg-bg-soft"
            >
              <LifeBuoy size={15} />
              Support
            </Link>
            <div className="my-1 border-t border-navy/[0.06]" />
            <span className="flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/35">
              <LogOut size={15} />
              Log out
            </span>
          </div>
        </>
      )}
    </div>
  )
}
