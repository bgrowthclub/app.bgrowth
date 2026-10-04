import { Menu } from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import NotificationButton from './NotificationButton'
import QuickActionButton from './QuickActionButton'
import MembershipBadge from './MembershipBadge'
import UserMenu from './UserMenu'
import ThemeToggleButton from './ThemeToggleButton'

interface Props {
  onOpenMobileSidebar: () => void
  // A dot on the mobile menu button when a sidebar item has a count.
  menuBadge?: boolean
}

export default function TopBar({ onOpenMobileSidebar, menuBadge = false }: Props) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-navy/[0.06] bg-white/90 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-navy md:hidden"
        >
          <Menu size={20} />
          {menuBadge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />}
        </button>

        <div className="max-w-sm flex-1">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <QuickActionButton />
          <NotificationButton />
          <ThemeToggleButton />
          {/* Hidden below sm — the one item here with no shorter fallback
              form, and it overflowed a 375px viewport when always shown. */}
          <span className="hidden sm:inline-flex">
            <MembershipBadge />
          </span>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
