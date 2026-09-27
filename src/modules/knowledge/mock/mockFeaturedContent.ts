import type { FeaturedContent } from '../types/featuredContent'

// Curated placements for the Knowledge Home's "Featured Articles,"
// "Featured Guides," and "Featured Videos" sections — a future Studio
// editor re-curates these by changing data, never by editing a page.
export const MOCK_FEATURED_CONTENT: FeaturedContent[] = [
  { id: 'feat-articles-1', articleSlug: 'start-a-business-checklist', placement: 'featured-articles', order: 1 },
  { id: 'feat-articles-2', articleSlug: 'cleaning-business-startup-costs', placement: 'featured-articles', order: 2 },
  { id: 'feat-articles-3', articleSlug: 'real-estate-showing-checklist', placement: 'featured-articles', order: 3 },

  { id: 'feat-guides-1', articleSlug: 'mobile-notary-guide', placement: 'featured-guides', order: 1 },
  { id: 'feat-guides-2', articleSlug: 'choosing-a-business-entity', placement: 'featured-guides', order: 2 },
  { id: 'feat-guides-3', articleSlug: 'bookkeeping-basics-guide', placement: 'featured-guides', order: 3 },

  { id: 'feat-videos-1', articleSlug: 'pressure-washing-launch-video', placement: 'featured-videos', order: 1 },
  { id: 'feat-videos-2', articleSlug: 'budgeting-for-solo-founders-video', placement: 'featured-videos', order: 2 },
]
