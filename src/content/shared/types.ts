// BGrowth Content Architecture — Shared Types
//
// Foundational vocabulary reused across every future content ecosystem
// (Products, Knowledge, Academy, and whatever comes after). Types only —
// no data, no logic. See ../README.md for how this relates to the
// existing runtime data models (types/system.ts, modules/commerce).

export type ContentStatus = 'draft' | 'published' | 'archived' | 'coming-soon'

export type ContentDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type ContentLanguage = 'en' | 'pt' | 'es'

// Object-shaped (not a bare string union) so a category can carry more
// than a label later (icon, description, parent category) without a
// breaking change — same pattern as types/growth.ts's GrowthCategoryInfo.
export interface ContentCategory {
  id: string
  label: string
}

// The outcome a piece of content helps a member reach (e.g. "Start a
// Business", "Improve My Finances") — distinct from Category, which is
// the broader Growth Category it lives under.
export interface ContentGoal {
  id: string
  label: string
}

export interface ContentTag {
  id: string
  label: string
}

export interface ContentAuthor {
  id: string
  name: string
  avatar?: string
}
