import SidebarItem from './SidebarItem'
import type { PlatformNavGroup } from './platformNav'

interface Props {
  group: PlatformNavGroup
  collapsed?: boolean
  onNavigate?: () => void
}

export default function SidebarGroup({ group, collapsed = false, onNavigate }: Props) {
  return (
    <div>
      {group.label && !collapsed && (
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-navy/30">
          {group.label}
        </p>
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}
