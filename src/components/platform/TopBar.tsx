import { useState } from 'react'
import { Menu } from 'lucide-react'
import SearchBox from './SearchBox'
import NotificationButton from './NotificationButton'
import QuickActionButton from './QuickActionButton'
import MembershipBadge from './MembershipBadge'
import UserMenu from './UserMenu'
import ThemeToggleButton from './ThemeToggleButton'

interface Props {
  onOpenMobileSidebar: () => void
}

export default function TopBar({ onOpenMobileSidebar }: Props) {
  const [query, setQuery] = useState('')

  return (
    <header className="sticky top-0 z-30 border-b border-navy/[0.06] bg-white/90 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-navy md:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="max-w-sm flex-1">
          <SearchBox value={query} onChange={setQuery} placeholder="Search the platform…" />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <QuickActionButton />
          <NotificationButton />
          <ThemeToggleButton />
          <MembershipBadge />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
