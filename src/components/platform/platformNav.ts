import {
  LayoutDashboard,
  FolderOpen,
  LayoutGrid,
  GraduationCap,
  Users,
  Store,
  Compass,
  BookOpen,
  Settings,
  LifeBuoy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// The Platform Shell's sidebar is entirely driven by this config — Sidebar/
// SidebarGroup/SidebarItem only ever map over it. Adding a nav entry for a
// future product (Club, Academy, Find, ...) means adding a row here, never
// hardcoding a new <SidebarItem> in a component.
export interface PlatformNavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface PlatformNavGroup {
  label?: string
  items: PlatformNavItem[]
}

export const PLATFORM_NAV_GROUPS: PlatformNavGroup[] = [
  {
    items: [{ label: 'Dashboard', to: '/platform/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Business',
    items: [
      // My Business Systems now lives inside the Workspace itself (search,
      // filter, sort — see pages/platform/MyBusinessSystemsPage.tsx). The
      // legacy /my-systems page (marketing AppLayout) is untouched and still
      // reachable from its own nav, but the Workspace no longer points at it.
      { label: 'My Business Systems', to: '/platform/my-systems', icon: FolderOpen },
      // BGrowth App still points at the existing catalog browse page — see
      // ARCHITECTURE.md on the Runtime.
      { label: 'BGrowth App', to: '/systems', icon: LayoutGrid },
    ],
  },
  {
    label: 'Grow',
    items: [
      { label: 'Academy', to: '/platform/academy', icon: GraduationCap },
      { label: 'Community', to: '/platform/community', icon: Users },
      { label: 'Marketplace', to: '/platform/marketplace', icon: Store },
      { label: 'Find Professionals', to: '/platform/find', icon: Compass },
      { label: 'Resources', to: '/platform/resources', icon: BookOpen },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', to: '/platform/settings', icon: Settings },
      { label: 'Support', to: '/platform/support', icon: LifeBuoy },
    ],
  },
]
