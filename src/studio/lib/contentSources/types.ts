import type { Product, ProductDifficulty } from '../../../modules/commerce/types/product'
import type { ContentSourceType } from '../../../modules/commerce/types/contentSource'

// A lightweight, provider-agnostic snapshot of "the real content a Product
// sells" — enough to auto-fill the General tab's fields. Every future
// Content Source provider (Planner, Calculator, Academy course, Template
// Pack) maps its own content shape onto this same snapshot; the Product
// Engine's Content Source tab never needs to know the difference.
export interface ContentSourceSnapshot {
  title: string
  description: string
  longDescription?: string
  industry?: string
  category?: string
  difficulty?: ProductDifficulty
  estimatedTime?: string
  thumbnail?: string
}

export interface ContentSourceOption {
  id: string
  label: string
}

// One implementation per ContentSourceType. `list` powers the picker;
// `load` resolves a snapshot for the Content Source tab's preview panel;
// `applyToProduct` is the one place a snapshot's fields are written onto a
// Product draft — read-only on the source side, exactly like
// applyWorkspaceToProductDraft was before this generalized it (see
// lib/workspaceImport.ts, now superseded by growthSystemSource.ts).
export interface ContentSourceProvider {
  type: ContentSourceType
  label: string
  list(): ContentSourceOption[]
  load(id: string): ContentSourceSnapshot | undefined
  applyToProduct(product: Product, id: string): Product
}
