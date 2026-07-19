import type { LucideIcon } from 'lucide-react'

// Public-website "Knowledge" content — articles, categories, free downloads,
// and long-form guides. Deliberately separate from types/journey.ts (Studio's
// internal Journey/Stage/KnowledgeObject model): this is CMS-shaped marketing
// content, not the authoring data model. `icon` stands in for a cover image
// until a real CMS provides one — swapping it for `coverImageUrl` later is a
// component-level change only, not a data-shape rewrite.

export interface KnowledgeArticle {
  id: string
  slug: string
  title: string
  description: string
  category: string
  readTime: string
  icon: LucideIcon
}

export interface ArticleCategory {
  id: string
  name: string
  icon: LucideIcon
  articleCount: number
}

export type FreeResourceType = 'Checklist' | 'Guide' | 'Worksheet' | 'Template' | 'PDF'

export interface FreeResource {
  id: string
  title: string
  type: FreeResourceType
}

export interface FeaturedGuide {
  id: string
  slug: string
  title: string
  description: string
  readTime: string
  icon: LucideIcon
}
