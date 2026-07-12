// BGrowth Content Architecture — Product Manifest & Product Schema
//
// Types only — no data, no logic, nothing wired into the app. This is the
// future contract every BGrowth Studio Builder generates files against
// (manifest.json / product.json per product folder — see ../README.md).
//
// Deliberately named ContentManifest/ContentProduct rather than the bare
// Manifest/Product to avoid any ambiguity with the existing, actively-used
// Product type in modules/commerce/types/product.ts.

import type {
  ContentCategory,
  ContentGoal,
  ContentDifficulty,
  ContentLanguage,
  ContentStatus,
  ContentTag,
  ContentAuthor,
} from '../shared/types'

// The kind of content a manifest describes. Extensible — a future Builder
// may introduce new types without changing this union's consumers.
export type ContentType = 'product' | 'article' | 'course' | 'template' | 'tool'

// Catalog-facing metadata — everything needed to list, filter, search, and
// preview a piece of content without loading its full body (product.json).
export interface ContentManifest {
  id: string
  slug: string
  title: string
  description: string
  type: ContentType
  category: ContentCategory
  goal?: ContentGoal
  industry?: string
  difficulty: ContentDifficulty
  language: ContentLanguage
  featured: boolean
  status: ContentStatus
  price?: number
  coverImage?: string
  thumbnail?: string
  icon?: string
  author?: ContentAuthor
  createdAt: string
  updatedAt: string
  version: string
  tags: ContentTag[]
}

// --- Product body — the full authored content a manifest points to ------

export interface ContentSection {
  id: string
  title: string
  description?: string
  order: number
}

export interface ContentChecklistItem {
  id: string
  label: string
  done?: boolean
}

export interface ContentChecklist {
  id: string
  title: string
  items: ContentChecklistItem[]
}

export interface ContentPlanner {
  id: string
  title: string
  sections: ContentSection[]
}

export interface ContentCalculatorField {
  id: string
  label: string
  type: 'number' | 'currency' | 'percentage'
}

export interface ContentCalculator {
  id: string
  title: string
  fields: ContentCalculatorField[]
}

export interface ContentNote {
  id: string
  title: string
  body: string
}

export interface ContentResource {
  id: string
  title: string
  type: string
  url?: string
}

export interface ContentAsset {
  id: string
  type: 'image' | 'document' | 'video' | 'file'
  url: string
  alt?: string
}

// The interactive parts of a product — deliberately optional/partial so a
// simple product (e.g. a single planner) doesn't need every field.
export interface ContentWorkspace {
  planners?: ContentPlanner[]
  checklists?: ContentChecklist[]
  calculators?: ContentCalculator[]
  notes?: ContentNote[]
}

export interface ContentSEO {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
}

// Deliberately open-ended — future Builders may attach structured metadata
// this schema doesn't anticipate yet, without a breaking change.
export type ContentMetadata = Record<string, unknown>

export interface ContentProduct {
  manifest: ContentManifest
  sections: ContentSection[]
  workspace?: ContentWorkspace
  resources?: ContentResource[]
  assets?: ContentAsset[]
  seo?: ContentSEO
  metadata?: ContentMetadata
}
