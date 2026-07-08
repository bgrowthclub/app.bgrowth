import { Link } from 'react-router-dom'
import { PanelLeftClose, PanelLeft, X } from 'lucide-react'
import logo from '../../assets/logo.png'
import SidebarGroup from './SidebarGroup'
import { PLATFORM_NAV_GROUPS } from './platformNav'

interface Props {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {PLATFORM_NAV_GROUPS.map((group, i) => (
        <SidebarGroup key={group.label ?? i} group={group} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}

export default function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: Props) {
  return (
    <>
      {/* Desktop / tablet — persistent column, collapsible to icon-only */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-navy/[0.06] bg-white transition-all duration-300 lg:flex ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className={`flex items-center gap-2.5 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
          <Link to="/platform/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <img src={logo} alt="BGrowth" className="h-8 w-8 shrink-0 object-contain" />
            {!collapsed && (
              <span className="truncate font-display text-[16px] font-bold tracking-tight text-navy">
                BGrowth
              </span>
            )}
          </Link>
        </div>

        <SidebarBody collapsed={collapsed} />

        <div className="border-t border-navy/[0.06] p-3">
          <button
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/50 transition-colors hover:bg-bg-soft hover:text-navy ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile — overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-navy/20 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-glow">
            <div className="flex items-center justify-between px-4 py-5">
              <Link to="/platform/dashboard" className="flex items-center gap-2.5" onClick={onCloseMobile}>
                <img src={logo} alt="BGrowth" className="h-8 w-8 object-contain" />
                <span className="font-display text-[16px] font-bold tracking-tight text-navy">BGrowth</span>
              </Link>
              <button
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full text-navy/40 hover:bg-bg-soft hover:text-navy"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarBody collapsed={false} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  )
}
