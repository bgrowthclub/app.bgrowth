// ---------------------------------------------------------------------------
// BGrowth Knowledge Ecosystem — Journey data model
// ---------------------------------------------------------------------------
// Distinct from BusinessSystem (types/system.ts), which is a commerce
// bundle sold in the Runtime. A Journey is the knowledge graph a customer
// goal decomposes into — Stages, then Knowledge Assets — and is the source
// of truth commerce bundles (and future Academy courses, Marketplace
// listings, articles, and AI coaches) get built from. One Knowledge Asset
// may ship as more than one OutputFormat.

export type OutputFormat = 'Workspace' | 'Academy' | 'Marketplace' | 'Article' | 'AI Coaching' | 'Website Page'

export type AssetKind = 'Assessment' | 'Planner' | 'Workflow' | 'Toolkit' | 'Guide' | 'Checklist' | 'Tracker' | 'Template' | 'Playbook'

export interface KnowledgeAsset {
  id: string
  title: string // premium name, e.g. "Cleaning Business Readiness Assessment™"
  kind: AssetKind
  problem: string // the one problem this asset solves — never overlaps a sibling asset
  summary: string
  outputFormats: OutputFormat[]
  leadsTo?: string // id of the asset this one hands off to next
}

export interface JourneyStage {
  id: string
  name: string
  description: string
  assets: KnowledgeAsset[]
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

export function getJourneyAssetCount(journey: Journey) {
  return journey.stages.reduce((sum, stage) => sum + stage.assets.length, 0)
}
