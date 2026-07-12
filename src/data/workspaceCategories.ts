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
  { slug: 'business', icon: Briefcase, name: 'Business', description: 'Launch, organize and grow your next business with interactive workspaces.', count: publishedCount },
  { slug: 'career', icon: Building2, name: 'Career', description: 'Plan your career, build new skills and move toward better opportunities.', count: 0 },
  { slug: 'finance', icon: PiggyBank, name: 'Finance', description: 'Take control of your money, budgeting and long-term financial goals.', count: 0 },
  { slug: 'health', icon: HeartPulse, name: 'Health', description: 'Create healthier habits, routines and wellness plans that last.', count: 0 },
  { slug: 'learning', icon: GraduationCap, name: 'Learning', description: 'Learn new skills, languages and knowledge through guided workspaces.', count: 0 },
  { slug: 'lifestyle', icon: HomeIcon, name: 'Lifestyle', description: 'Organize your home, routines and personal projects with confidence.', count: 0 },
]

// Every system in today's catalog belongs to the Business & Entrepreneurship
// Workspace — the only live Growth Category (see CLAUDE.md §2). Referenced
// wherever a system needs to declare its Workspace (e.g. ProductPage's
// checkout hand-off) until BusinessSystem gains its own workspace/category
// field.
export const DEFAULT_WORKSPACE_SLUG = 'business'
