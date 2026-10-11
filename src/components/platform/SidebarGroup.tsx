import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import SidebarItem from './SidebarItem'
import type { PlatformNavGroup } from './platformNav'
import type { NavBadges } from './useNavBadges'

interface Props {
  group: PlatformNavGroup
  collapsed?: boolean
  badges?: NavBadges
  onNavigate?: () => void
  // Less space above (a collapsible group right after another one).
  tight?: boolean
}

export default function SidebarGroup({ group, collapsed = false, badges = {}, onNavigate, tight = false }: Props) {
  const { pathname } = useLocation()
  const holdsCurrentPage = group.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  // A collapsible group starts open only when it holds the current page,
  // and opens by itself when you navigate into it.
  const [open, setOpen] = useState(holdsCurrentPage)
  useEffect(() => {
    if (holdsCurrentPage) setOpen(true)
  }, [holdsCurrentPage])

  const canCollapse = Boolean(group.collapsible) && !collapsed
  const showItems = !canCollapse || open
  // While closed, the group's title still shows what is waiting inside.
  const waiting = group.items.reduce((sum, item) => sum + (item.badge ? badges[item.badge] ?? 0 : 0), 0)

  return (
    <div className={tight ? '!mt-1' : undefined}>
      {group.label && !collapsed && !canCollapse && (
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-navy/30">
          {group.label}
        </p>
      )}
      {canCollapse && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mb-0.5 flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-navy/40 transition-colors hover:bg-bg-soft hover:text-navy/70"
        >
          <ChevronRight size={13} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          <span className="flex-1 truncate">{group.label}</span>
          {!open && waiting > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{waiting}</span>
          )}
        </button>
      )}
      {showItems && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <SidebarItem
              key={item.to}
              item={item}
              count={item.badge ? badges[item.badge] : undefined}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
