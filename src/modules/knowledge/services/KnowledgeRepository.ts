import type { KnowledgeArticle, KnowledgeArticleIndexEntry } from '../types/article'
import type { KnowledgeCategory } from '../types/category'
import type { KnowledgeAuthor } from '../types/author'
import type { KnowledgeTag } from '../types/tag'
import type { FeaturedContent } from '../types/featuredContent'
import type { LearningPath } from '../types/learningPath'

// The seam between "where Knowledge content comes from" and everything
// that queries it (KnowledgeService, below) — mirrors Commerce's
// ProductRepository (see modules/commerce/services/ProductRepository.ts).
// Index-first by design: a page loads the lightweight article index, decides
// what it needs, and only then loads an individual article's full body.
//
// Today the only implementation (store/mockKnowledgeRepository.ts) reads
// from the local mock/ arrays. Once BGrowth Studio publishes real Knowledge
// Packages, a RemoteKnowledgeRepository implementing this same interface
// replaces it — KnowledgeService and every page consuming it stay
// unchanged; only the repository passed into createKnowledgeService does.
export interface KnowledgeRepository {
  loadArticleIndex(): Promise<KnowledgeArticleIndexEntry[]>
  loadArticle(slug: string): Promise<KnowledgeArticle | undefined>
  loadCategories(): Promise<KnowledgeCategory[]>
  loadAuthors(): Promise<KnowledgeAuthor[]>
  loadTags(): Promise<KnowledgeTag[]>
  loadFeaturedContent(): Promise<FeaturedContent[]>
  loadLearningPaths(): Promise<LearningPath[]>
}
