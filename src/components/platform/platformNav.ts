import {
  ShoppingBag,
  Newspaper,
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
  UserCog,
  Receipt,
  Headset,
  Tags,
  Mail,
  Star,
  UserX,
  ClipboardCheck,
  Package,
  SquareUser,
  ShieldCheck,
  History,
  Megaphone,
  Tag,
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
  // In an adminOnly group: also shown to the Support role (see
  // modules/admin/permissions.ts). Without it, Admins only.
  support?: boolean
  // Shown only to a member who has their own public page (User.memberPage).
  pageOwnerOnly?: boolean
  // Other routes that keep this row highlighted (e.g. My Workspaces stays
  // active on /platform/documents, its second tab).
  alsoActiveOn?: string[]
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
  // Opens and closes from its title; starts open only when it holds the
  // current page (see SidebarGroup.tsx).
  collapsible?: boolean
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
      // One entry for both (decided 16/10/2026): the products the member
      // can open and what they filled in ("My Documents",
      // pages/platform/MyDocumentsPage.tsx) — shared "Workspaces |
      // Documents" tabs on both pages (MyWorkspacesTabs). Both routes stay.
      { label: 'My Workspaces', to: '/platform/my-systems', icon: FolderOpen, alsoActiveOn: ['/platform/documents'] },
      // The store (decided 17/10/2026): members had no menu path to the
      // catalog — every product to buy, at /systems.
      { label: 'Catalog', to: '/systems', icon: ShoppingBag },
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
      // The Knowledge hub (articles published from Studio), Sprint 114.
      { label: 'Knowledge', to: '/knowledge', icon: Newspaper },
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
      { label: 'My Page', to: '/platform/my-page', icon: SquareUser, pageOwnerOnly: true },
      { label: 'Settings', to: '/platform/settings', icon: Settings },
      { label: 'Support', to: '/platform/support', icon: LifeBuoy, badge: 'supportUnread' },
    ],
  },
  // The Admin area in four groups that open and close (decided 11/10/2026
  // so the menu doesn't grow endless); the group of the page you're on
  // opens by itself.
  {
    label: 'Admin · Overview',
    adminOnly: true,
    collapsible: true,
    items: [
      { label: 'Dashboard', to: '/platform/admin/dashboard', icon: LayoutDashboard },
      { label: 'Sales', to: '/platform/admin/sales', icon: Receipt },
      { label: 'Activity', to: '/platform/admin/activity', icon: History },
    ],
  },
  {
    label: 'Admin · People',
    adminOnly: true,
    collapsible: true,
    items: [
      { label: 'Members', to: '/platform/admin/members', icon: UserCog, support: true },
      { label: 'Support', to: '/platform/admin/support', icon: Headset, badge: 'supportWaiting', support: true },
      { label: 'Team', to: '/platform/admin/team', icon: ShieldCheck },
      { label: 'Deletions', to: '/platform/admin/deletions', icon: UserX, badge: 'deletionsPending' },
    ],
  },
  {
    label: 'Admin · Catalog',
    adminOnly: true,
    collapsible: true,
    items: [
      { label: 'Health Check', to: '/platform/admin/catalog', icon: ClipboardCheck },
      { label: 'Bundles', to: '/platform/admin/bundles', icon: Package },
      { label: 'Categories', to: '/platform/admin/categories', icon: Tags },
      { label: 'Tags', to: '/platform/admin/tags', icon: Tag },
      { label: 'Reviews', to: '/platform/admin/reviews', icon: Star, support: true },
    ],
  },
  {
    label: 'Admin · Site & content',
    adminOnly: true,
    collapsible: true,
    items: [
      { label: 'Site', to: '/platform/admin/site', icon: Megaphone },
      { label: 'Pages', to: '/platform/admin/pages', icon: SquareUser },
      { label: 'Newsletter', to: '/platform/admin/newsletter', icon: Mail },
    ],
  },
]
