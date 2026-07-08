// Shared vocabulary for BGrowth's eight Growth Categories (see
// PRODUCT_CATALOG.md). Lives outside src/modules/commerce so both the
// Commerce module's Product model and any future generalization of the
// core system type (see ARCHITECTURE.md's BusinessSystem → GrowthSystem
// recommendation) can share one definition instead of each inventing its
// own category list.

export type GrowthCategoryId =
  | 'business-entrepreneurship'
  | 'careers-professions'
  | 'languages'
  | 'personal-finance'
  | 'productivity'
  | 'education'
  | 'health-wellness'
  | 'family-lifestyle'

export interface GrowthCategoryInfo {
  id: GrowthCategoryId
  label: string
  emoji: string
}

export const GROWTH_CATEGORIES: GrowthCategoryInfo[] = [
  { id: 'business-entrepreneurship', label: 'Business & Entrepreneurship', emoji: '💼' },
  { id: 'careers-professions', label: 'Careers & Professions', emoji: '💼' },
  { id: 'languages', label: 'Languages', emoji: '🌍' },
  { id: 'personal-finance', label: 'Personal Finance', emoji: '💰' },
  { id: 'productivity', label: 'Productivity', emoji: '🎯' },
  { id: 'education', label: 'Education', emoji: '🎓' },
  { id: 'health-wellness', label: 'Health & Wellness', emoji: '❤️' },
  { id: 'family-lifestyle', label: 'Family & Lifestyle', emoji: '🏡' },
]
