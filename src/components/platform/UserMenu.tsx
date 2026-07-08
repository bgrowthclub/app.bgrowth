import { Link } from 'react-router-dom'
import { UserCircle, Settings, LifeBuoy, LogOut } from 'lucide-react'
import Popover from './Popover'

// Placeholder only — there is no session/identity yet, so the name below is
// static and Logout is purely visual (see CLAUDE.md: no auth without
// explicit direction). Settings/Support already route to real pages.
export default function UserMenu() {
  return (
    <Popover
      panelClassName="w-52 p-1.5"
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          aria-label="Account menu — Guest Member"
          aria-haspopup="true"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-bg-soft"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-grad-primary text-white">
            <UserCircle size={18} strokeWidth={2} />
          </span>
          <span className="hidden text-[13px] font-semibold text-navy/80 sm:inline">Guest Member</span>
        </button>
      )}
    >
      <Link
        to="/platform/settings"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/70 hover:bg-bg-soft"
      >
        <Settings size={15} />
        Settings
      </Link>
      <Link
        to="/platform/support"
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
    </Popover>
  )
}
