// An explicit, curated "related content" edge between one article and the
// others shown on its Article Page — separate from KnowledgeArticle's own
// `relatedArticleSlugs` shorthand so a future Studio export can also express
// relations that don't originate from the article itself (e.g. a category
// editor pinning "always show this Guide alongside these five Articles").
export interface RelatedContent {
  articleSlug: string
  relatedArticleSlugs: string[]
}
