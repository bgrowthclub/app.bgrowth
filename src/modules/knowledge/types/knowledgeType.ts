// The content-format taxonomy for BGrowth Knowledge — "Browse by Content
// Type" on the Knowledge Home. Deliberately separate from Commerce's
// ProductType (types/product.ts): a Knowledge Package is free, editorial
// content, not a sellable Product — a KnowledgeArticle may still reference
// related Products (see RelatedContent), but never carries commerce fields
// itself.
export type KnowledgeType =
  | 'Article'
  | 'Guide'
  | 'Checklist'
  | 'Planner'
  | 'Calculator'
  | 'Template'
  | 'Video'
  | 'Download'

export const KNOWLEDGE_TYPES: KnowledgeType[] = [
  'Article',
  'Guide',
  'Checklist',
  'Planner',
  'Calculator',
  'Template',
  'Video',
  'Download',
]
