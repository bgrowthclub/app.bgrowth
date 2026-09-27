import type { KnowledgeType } from './knowledgeType'

// A pull-quote/tip/warning box inside an article body — rendered between
// body sections (see components/knowledge/ArticleCallout.tsx).
export interface KnowledgeCalloutCard {
  title: string
  body: string
}

// One paragraph or heading of an article body. A future BGrowth Studio
// export is expected to publish structured body blocks like this rather
// than a single HTML string, so the Runtime never needs a sanitizer for
// author-authored markup — kept simple (two block kinds) since this is
// mock content, not a rich-text renderer.
export interface KnowledgeBodyBlock {
  kind: 'heading' | 'paragraph'
  text: string
}

// The universal free-content unit for BGrowth Knowledge — every future
// content type (Article, Guide, Checklist, Planner, Calculator, Template,
// Video, Download) is represented as one of these, distinguished by `type`.
// This is the Knowledge equivalent of Commerce's Product: one shape, no
// per-type clone.
export interface KnowledgeArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  body: KnowledgeBodyBlock[]
  type: KnowledgeType
  categorySlug: string
  tagSlugs: string[]
  authorId: string
  publishedAt: string // ISO date string
  updatedAt?: string // ISO date string
  readingTimeMinutes: number
  featured?: boolean
  calloutCards?: KnowledgeCalloutCard[]
  // Slugs into data/systems.ts's BusinessSystem catalog — resolved into
  // full records by a page, never stored denormalized here.
  relatedProductSlugs?: string[]
  relatedArticleSlugs?: string[]
}

// The lightweight row a future Studio-published Knowledge index would list
// up front — enough to render every card/grid/search result without
// loading an article's full body. Derived from KnowledgeArticle itself
// (Pick, not a re-typed copy) so the two can never drift apart, mirroring
// Commerce's ProductIndexEntry (see modules/commerce/types/product.ts).
export type KnowledgeArticleIndexEntry = Pick<
  KnowledgeArticle,
  | 'id'
  | 'slug'
  | 'title'
  | 'excerpt'
  | 'type'
  | 'categorySlug'
  | 'tagSlugs'
  | 'authorId'
  | 'publishedAt'
  | 'readingTimeMinutes'
  | 'featured'
>
