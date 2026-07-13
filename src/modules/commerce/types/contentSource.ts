// A Product's Content Source — what real content it wraps and sells,
// without duplicating that content's data. Generalizes what earlier
// milestones called "importing a Workspace": today only `GrowthSystem`
// (a BusinessSystem in data/systems.ts) has a real provider (see
// src/studio/lib/contentSources/), but every type below already
// type-checks on Product.source so a Planner, Calculator, Academy course,
// or Template Pack product can plug in later without redesigning the
// Product Engine's Content Source tab or the Product model itself.
export type ContentSourceType =
  | 'GrowthSystem'
  | 'Planner'
  | 'Calculator'
  | 'Course'
  | 'TemplatePack'
  | 'MarketplaceItem'
  | 'MembershipPlan'
  | 'Bundle'
  | 'External'

// Points a Product back at the real content it sells — Commerce never
// forks or re-authors that content, it only records how something already
// defined elsewhere (in this repo's data/, or a future Studio builder's
// own export) is sold. See ARCHITECTURE.md's Commerce Architecture
// section.
export interface ContentSourceRef {
  type: ContentSourceType
  id: string
}
