// BGrowth Journeys (Portal migration 0066) — guided paths to a goal, shown
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
}

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
  validatedStates: string[]
  stages: JourneyStage[]
}
