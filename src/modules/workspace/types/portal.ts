import type { WorkspaceContent } from './content'

// Row shapes read from the Portal's `portal` schema — only the columns this
// site uses. The Portal repository (src/types/database.ts,
// supabase/migrations/) stays the source of truth for the full schema.

export interface PortalProductRow {
  id: string
  slug: string
  name: string
  short_description: string
  cover_image_url: string | null
  category_id: string | null
  is_trial_eligible: boolean
  trial_duration: number | null
  content_type: string
  metadata: Record<string, unknown>
  status: string
  content: WorkspaceContent | null
  welcome_pdf_url: string | null
  is_free: boolean
  price_cents: number | null
  currency: string
  last_published_at: string | null
  created_at: string
}

export interface PortalCatalogRow {
  product_id: string
  slug: string
  name: string
  short_description: string
  content_type: string
  category_id: string | null
  cover_image_url: string | null
  is_featured: boolean
  is_best_seller: boolean
  is_recommended: boolean
  tags: string[]
  avg_rating: number | null
  review_count: number
  is_free: boolean
  price_cents: number | null
  currency: string
  is_trial_eligible: boolean
  published_at: string | null
  updated_at: string
}

export interface PortalCategoryRow {
  id: string
  name: string
  slug: string
}

export interface PortalLicenseRow {
  id: string
  product_id: string
  type: 'trial' | 'purchased' | 'subscription' | 'enterprise'
  status: 'active' | 'expired' | 'revoked'
  access_policy: 'expiring' | 'lifetime'
  activated_at: string
  expires_at: string | null
  last_opened_at: string | null
}

export interface PortalAccessGrantRow {
  scope: 'specific' | 'all'
  product_id: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

export interface WorkspaceInstanceRow {
  id: string
  user_id: string
  product_id: string
  label: string
  data: Record<string, unknown>
  status: 'in_progress' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

// Optional marketing fields Studio can publish into products.metadata
// (Portal: src/types/productMarketing.ts). Every field may be absent.
export interface PortalMarketingMetadata {
  longDescription?: string
  features?: { icon?: string; title: string; description: string }[]
  included?: string[]
  screenshots?: string[]
  faq?: { question: string; answer: string }[]
  tags?: string[]
}
