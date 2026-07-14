// A curated placement of one KnowledgeArticle on the Knowledge Home — kept
// as its own record (rather than a hardcoded `.slice(0, 3)` in a page) so a
// future BGrowth Studio editor can reorder/re-curate what's featured
// without a code change. `order` is ascending display order within a
// placement.
export type FeaturedContentPlacement = 'hero' | 'featured-articles' | 'featured-guides' | 'featured-videos'

export interface FeaturedContent {
  id: string
  articleSlug: string
  placement: FeaturedContentPlacement
  order: number
}
