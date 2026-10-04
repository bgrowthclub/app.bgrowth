import { NavLink } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useComingSoonModal } from './ComingSoonModalProvider'
import type { PlatformNavItem } from './platformNav'

interface Props {
  item: PlatformNavItem
  collapsed?: boolean
  // Live count from platformNav's `badge` (hidden when 0).
  count?: number
  onNavigate?: () => void
}

export default function SidebarItem({ item, collapsed = false, count = 0, onNavigate }: Props) {
  const { label, to, icon: Icon, locked } = item
  const { openComingSoon } = useComingSoonModal()

  if (locked) {
    return (
      <button
        type="button"
        onClick={openComingSoon}
        aria-label={`${label} — coming soon`}
        title={`${label} — coming soon`}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-navy/50 opacity-70 transition-colors hover:bg-bg-soft hover:opacity-100 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <Icon size={17} strokeWidth={2} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{label}</span>
            <Lock size={12} className="shrink-0 text-navy/30" />
          </>
        )}
      </button>
    )
  }

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
          isActive ? 'bg-bg-soft text-primary' : 'text-navy/60 hover:bg-bg-soft hover:text-navy'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      <Icon size={17} strokeWidth={2} className="shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {count > 0 &&
        (collapsed ? (
          <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-primary" aria-label={`${count} new`} />
        ) : (
          <span className="min-w-[20px] rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        ))}
    </NavLink>
  )
}
