import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  LayoutGrid,
  GraduationCap,
  Users,
  Store,
  Compass,
  BookOpen,
  Settings,
  LifeBuoy,
  UserCog,
  Receipt,
  Headset,
  Tags,
  Mail,
  Star,
  UserX,
  ClipboardCheck,
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
  // Renders as an inert, reduced-opacity row with a lock icon that opens
  // the ComingSoonModal instead of navigating — see SidebarItem.tsx. Only
  // Dashboard, My Workspaces, Settings, and Support are unlocked today.
  locked?: boolean
  // A live count shown next to the label (see useNavBadges.ts).
  badge?: NavBadgeKey
}

// supportUnread: the member's conversations with a reply they haven't
// read; supportWaiting: open conversations waiting for the team (admins);
// deletionsPending: account deletion requests waiting for the team.
export type NavBadgeKey = 'supportUnread' | 'supportWaiting' | 'deletionsPending'

export interface PlatformNavGroup {
  label?: string
  items: PlatformNavItem[]
  // Shown only to BGrowth administrators (User.isAdmin) — see Sidebar.tsx.
  // The routes themselves are gated by AdminRoute and the server.
  adminOnly?: boolean
}

export const PLATFORM_NAV_GROUPS: PlatformNavGroup[] = [
  {
    items: [{ label: 'Dashboard', to: '/platform/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Business',
    items: [
      // My Workspaces now lives inside the Workspace itself (search,
      // filter, sort — see pages/platform/MyBusinessSystemsPage.tsx). The
      // legacy /my-systems page (marketing AppLayout) is untouched and still
      // reachable from its own nav, but the Workspace no longer points at it.
      { label: 'My Workspaces', to: '/platform/my-systems', icon: FolderOpen },
      // Every saved record across Studio Workspaces — the Portal's "My
      // Documents" (see pages/platform/MyDocumentsPage.tsx).
      { label: 'My Documents', to: '/platform/documents', icon: FileText },
      // BGrowth App still points at the existing catalog browse page (see
      // ARCHITECTURE.md on the Runtime) but is locked here — it isn't
      // available as its own experience inside the Workspace yet. /systems
      // itself is untouched and reachable through other paths.
      { label: 'BGrowth App', to: '/systems', icon: LayoutGrid, locked: true },
    ],
  },
  {
    label: 'Grow',
    items: [
      { label: 'Academy', to: '/platform/academy', icon: GraduationCap, locked: true },
      // Renamed from "Community" — this is the sidebar entry for what
      // VISION.md calls BGrowth Club™ (see CLAUDE.md's naming-gap note).
      // It's being locked at the same time, so this finally makes the
      // rename deliberate rather than a silent side effect.
      { label: 'Club', to: '/platform/community', icon: Users, locked: true },
      { label: 'Marketplace', to: '/platform/marketplace', icon: Store, locked: true },
      { label: 'Find Professionals', to: '/platform/find', icon: Compass, locked: true },
      { label: 'Resources', to: '/platform/resources', icon: BookOpen, locked: true },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', to: '/platform/settings', icon: Settings },
      { label: 'Support', to: '/platform/support', icon: LifeBuoy, badge: 'supportUnread' },
    ],
  },
  {
    label: 'Admin',
    adminOnly: true,
    items: [
      { label: 'Dashboard', to: '/platform/admin/dashboard', icon: LayoutDashboard },
      { label: 'Members', to: '/platform/admin/members', icon: UserCog },
      { label: 'Sales', to: '/platform/admin/sales', icon: Receipt },
      { label: 'Support', to: '/platform/admin/support', icon: Headset, badge: 'supportWaiting' },
      { label: 'Catalog', to: '/platform/admin/catalog', icon: ClipboardCheck },
      { label: 'Categories', to: '/platform/admin/categories', icon: Tags },
      { label: 'Newsletter', to: '/platform/admin/newsletter', icon: Mail },
      { label: 'Reviews', to: '/platform/admin/reviews', icon: Star },
      { label: 'Deletions', to: '/platform/admin/deletions', icon: UserX, badge: 'deletionsPending' },
    ],
  },
]
