// BGrowth Journeys (Portal migration 0068) — guided paths to a goal, shown
// only on this site. A Journey is a portal.products row (content_type
// 'journey') that browsers can't read directly: the site gets published
// Journeys only through two database functions, which resolve every
// referenced product/article on the server and never return details of an
// unpublished one.

/** One published Journey in the list (portal.list_journeys()). */
export interface JourneySummary {
  id: string
  slug: string
  name: string
  shortDescription: string
  coverImageUrl: string | null
  categoryId: string | null
  isFree: boolean
  publishedAt: string | null
  stageCount: number
  /** Sum of the shown actions' estimated minutes (0 = no times given). */
  estimatedMinutes: number
  /** Who the Journey is for ('' = not said). */
  audience: string
}

/** Where a stage sits: getting started, good practices, or growing. */
export type JourneyStageLevel = 'beginner' | 'best_practices' | 'expansion'

/** How a referenced resource is for members right now (resolved by the database). */
export type JourneyResourceState = 'available' | 'coming_soon' | 'unavailable'

export type JourneyActionKind = 'product' | 'article' | 'video' | 'link' | 'manual'

/** What the database returns for a published resource — nothing for the others. */
export type JourneyActionRef =
  | { productId: string; slug: string; name: string; contentType: string; isFree: boolean; priceCents: number | null; currency: string | null; coverImageUrl: string | null }
  | { slug: string; title: string; access: string; requiredPlanName: string | null }
  | { url: string }
  | null

export interface JourneyAction {
  id: string
  title: string
  instructions: string
  optional: boolean
  /** Estimated whole minutes, or null when not given. */
  estimatedMinutes: number | null
  kind: JourneyActionKind
  state: JourneyResourceState
  ref: JourneyActionRef
  /** Only for these (validated) states; empty = everyone. */
  states: string[]
}

export interface JourneyStage {
  id: string
  title: string
  summary: string
  level: JourneyStageLevel | null
  /** Sum of this stage's actions' minutes (0 = no times given). */
  estimatedMinutes: number
  actions: JourneyAction[]
}

/** A published Journey with its references resolved (portal.get_journey_outline(slug)). */
export interface JourneyOutline {
  id: string
  slug: string
  name: string
  shortDescription: string
  coverImageUrl: string | null
  categoryId: string | null
  isFree: boolean
  publishedAt: string | null
  goal: string
  intro: string
  completionMessage: string
  notice: string
  audience: string
  /** What the member should have at the end. */
  outcomes: string[]
  /** Sum of every shown action's minutes (0 = no times given). */
  estimatedMinutes: number
  validatedStates: string[]
  stages: JourneyStage[]
}
