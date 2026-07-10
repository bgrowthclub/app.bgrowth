// ---------------------------------------------------------------------------
// BGrowth Knowledge Ecosystem — Journey data model
// ---------------------------------------------------------------------------
// Distinct from BusinessSystem (types/system.ts), which is a commerce
// bundle sold in the Runtime. A Journey is the knowledge graph a customer
// goal decomposes into:
//
//   Goal -> Journey -> Stage -> Knowledge Object -> Learning Units -> Output Formats
//
// A KnowledgeObject is format-agnostic: it holds the reusable substance
// (its Learning Units) rather than any one presentation. `outputFormats`
// names the formats it's suited to become — Workspace, Academy,
// Marketplace, Article, AI Coaching, Website Page — but the object itself
// is never named after one of them, and one object commonly powers
// several formats at once.

export type OutputFormat = 'Workspace' | 'Academy' | 'Marketplace' | 'Article' | 'AI Coaching' | 'Website Page'

// The shape of the knowledge itself, not its output medium.
export type KnowledgeShape = 'Concept' | 'Decision' | 'Process' | 'Reference' | 'Data'

// One reusable, atomic teachable point inside a Knowledge Object — small
// enough to become a lesson, an article section, a workspace field, or an
// AI coaching prompt on its own.
export interface LearningUnit {
  id: string
  title: string
  detail?: string
}

export interface KnowledgeObject {
  id: string
  title: string // plain knowledge title — no format branding (no "Planner™", "Checklist™", "Guide™")
  shape: KnowledgeShape
  problem: string // the one problem/question this object answers — never overlaps a sibling
  summary: string
  learningUnits: LearningUnit[] // the reusable substance itself
  outputFormats: OutputFormat[]
  leadsTo?: string // id of the object this one hands off to next
}

export interface JourneyStage {
  id: string
  name: string
  description: string
  objects: KnowledgeObject[]
}

export interface Journey {
  id: string
  slug: string
  goal: string // the customer goal, e.g. "Start a Cleaning Business"
  title: string // premium journey title, e.g. "Cleaning Business Launch Journey™"
  industry?: string // maps to BusinessSystem.category where a commerce counterpart exists
  status: 'in-progress' | 'complete'
  stages: JourneyStage[]
}

export function getJourneyObjectCount(journey: Journey) {
  return journey.stages.reduce((sum, stage) => sum + stage.objects.length, 0)
}
