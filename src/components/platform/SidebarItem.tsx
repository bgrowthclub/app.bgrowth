import { NavLink } from 'react-router-dom'
import type { PlatformNavItem } from './platformNav'

interface Props {
  item: PlatformNavItem
  collapsed?: boolean
  onNavigate?: () => void
}

export default function SidebarItem({ item, collapsed = false, onNavigate }: Props) {
  const { label, to, icon: Icon } = item

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
          isActive ? 'bg-bg-soft text-primary' : 'text-navy/60 hover:bg-bg-soft hover:text-navy'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      <Icon size={17} strokeWidth={2} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}
