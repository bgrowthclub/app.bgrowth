// Knowledge's own content-topic taxonomy — "Browse by Category" on the
// Knowledge Home. Deliberately independent from GrowthCategoryId
// (types/growth.ts): Knowledge categories are granular editorial topics
// (Cleaning, Legal, Taxes, ...), not the platform's eight top-level Growth
// Categories. A future BGrowth Studio export may tag a KnowledgeCategory
// with a GrowthCategoryId, but the two are not the same list.
export interface KnowledgeCategory {
  id: string
  slug: string
  name: string
  description?: string
}
