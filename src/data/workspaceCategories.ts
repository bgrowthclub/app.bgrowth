import { Briefcase, Building2, PiggyBank, HeartPulse, GraduationCap, Home as HomeIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SYSTEMS } from './systems'

// The six Workspace™ categories — a curated, homepage-and-marketing-only
// presentation of BGrowth's Growth Categories (see src/types/growth.ts and
// PRODUCT_CATALOG.md), not a new data model. Single source of truth for
// both the homepage's Workspace section (components/sections/LifeWorlds.tsx)
// and the standalone Workspace entry page (pages/WorkspacesPage.tsx) — never
// duplicate this list. Only Business & Entrepreneurship has a real catalog
// today, so it's the only category that links straight into /systems; the
// rest link to an honest per-category preview page instead of claiming a
// catalog that doesn't exist yet (see data/categoryPreviews.ts).
export interface WorkspaceCategory {
  slug: string
  icon: LucideIcon
  name: string
  description: string
  count: number
}

const publishedCount = SYSTEMS.filter((s) => s.status === 'published').length

export const WORKSPACE_CATEGORIES: WorkspaceCategory[] = [
  { slug: 'business', icon: Briefcase, name: 'Business', description: 'Start, launch, and run something of your own.', count: publishedCount },
  { slug: 'career', icon: Building2, name: 'Career', description: 'Grow into the profession you actually want.', count: 0 },
  { slug: 'finance', icon: PiggyBank, name: 'Finance', description: 'Take control of money, budgeting, and the future.', count: 0 },
  { slug: 'health', icon: HeartPulse, name: 'Health', description: 'Build habits that make you stronger, longer.', count: 0 },
  { slug: 'learning', icon: GraduationCap, name: 'Learning', description: 'Pick up the skills and languages that open doors.', count: 0 },
  { slug: 'lifestyle', icon: HomeIcon, name: 'Lifestyle', description: 'Shape a life and a home you want to come back to.', count: 0 },
]
