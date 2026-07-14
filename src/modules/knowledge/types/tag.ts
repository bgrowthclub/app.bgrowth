// Free-form topical labels on a KnowledgeArticle — finer-grained than
// KnowledgeCategory (e.g. an article in the "Business" category might carry
// the "Mobile Notary" and "Getting Started" tags). Used for related-content
// matching and search, not for top-level browsing.
export interface KnowledgeTag {
  id: string
  slug: string
  name: string
}
