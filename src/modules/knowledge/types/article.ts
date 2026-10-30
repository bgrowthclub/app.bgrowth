import type { KnowledgeType } from './knowledgeType'

// A pull-quote/tip/warning box inside an article body — rendered between
// body sections (see components/knowledge/ArticleCallout.tsx).
export interface KnowledgeCalloutCard {
  title: string
  body: string
}

// One block of an article body. The Studio publishes structured blocks, not
// an HTML string, so the Runtime never needs a sanitizer for author-written
// markup — a link is a field, never markup inside the text.
//
// Until 30/10/2026 only six kinds were drawn and the Studio's cta, download,
// code and faq blocks were dropped on the way in, without a word: an author
// published a button and the article simply didn't have one. Those four are
// drawn now.
export interface KnowledgeBodyBlock {
  kind: 'heading' | 'paragraph' | 'quote' | 'image' | 'video' | 'divider' | 'cta' | 'download' | 'code' | 'faq'
  text: string
  /** heading: 2 or 3 (default 2) */
  level?: number
  /** image/video/cta/download address */
  url?: string
  /** cta/download: the heading of the card */
  title?: string
  /** cta: the button's words; download: the file size as the author wrote it */
  label?: string
  /** code: the language, as written in the Studio */
  language?: string
  /** faq: the questions and their answers */
  items?: { q: string; a: string }[]
}

// Who reads an article published from BGrowth Studio (Portal migration
// 0055): everyone, or signed-in members — a visitor then gets only the start
// (`locked`) and is asked to create a free account. Since Sprint 125 (Portal
// migration 0060) also 'plan': members on `requiredPlan` or a higher plan.
export type KnowledgeAccess = 'everyone' | 'members' | 'plan'

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
  // Studio-published articles (Portal 0054/0055):
  coverImage?: string
  language?: 'en' | 'pt'
  access?: KnowledgeAccess
  /** For access 'plan': the lowest plan that reads it whole. */
  requiredPlan?: { slug: string; name: string }
  /** true = only the start of the body was loaded (members-only, visitor). */
  locked?: boolean
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
  | 'coverImage'
  | 'language'
  | 'access'
  | 'requiredPlan'
>
