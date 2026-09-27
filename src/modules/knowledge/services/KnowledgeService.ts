import type { KnowledgeArticle, KnowledgeArticleIndexEntry } from '../types/article'
import type { KnowledgeType } from '../types/knowledgeType'
import type { KnowledgeCategory } from '../types/category'
import type { KnowledgeAuthor } from '../types/author'
import type { KnowledgeTag } from '../types/tag'
import type { FeaturedContentPlacement } from '../types/featuredContent'
import type { LearningPath } from '../types/learningPath'
import type { KnowledgeRepository } from './KnowledgeRepository'
import { createMockKnowledgeRepository } from '../store/mockKnowledgeRepository'

export interface KnowledgeArticleFilter {
  categorySlug?: string
  type?: KnowledgeType
  tagSlug?: string
}

// The Knowledge module's own "one array of free resource types," reused
// wherever the free-download types need to be enumerated together
// (getFreeResources below, and the Free Resources section on Knowledge
// Home) — never re-derive this list at a call site.
export const FREE_RESOURCE_TYPES: KnowledgeType[] = ['Checklist', 'Planner', 'Calculator', 'Template', 'Download']

// The rest of the app is expected to read Knowledge content through this
// service instead of importing mock/ arrays directly — mirrors Commerce's
// ProductService (see modules/commerce/services/ProductService.ts).
export interface KnowledgeService {
  getArticleBySlug(slug: string): Promise<KnowledgeArticle | undefined>
  listArticles(filter?: KnowledgeArticleFilter): Promise<KnowledgeArticleIndexEntry[]>
  searchArticles(query: string): Promise<KnowledgeArticleIndexEntry[]>
  getLatestArticles(limit?: number): Promise<KnowledgeArticleIndexEntry[]>
  getFeaturedByPlacement(placement: FeaturedContentPlacement): Promise<KnowledgeArticleIndexEntry[]>
  getFreeResources(): Promise<KnowledgeArticleIndexEntry[]>
  getRelatedArticles(slug: string, limit?: number): Promise<KnowledgeArticleIndexEntry[]>
  getCategories(): Promise<KnowledgeCategory[]>
  getCategoryBySlug(slug: string): Promise<KnowledgeCategory | undefined>
  getArticleCountByCategory(): Promise<Record<string, number>>
  getArticleCountByType(): Promise<Record<string, number>>
  getAuthorById(id: string): Promise<KnowledgeAuthor | undefined>
  getTags(): Promise<KnowledgeTag[]>
  getLearningPaths(): Promise<LearningPath[]>
}

function matchesFilter(entry: KnowledgeArticleIndexEntry, filter?: KnowledgeArticleFilter): boolean {
  if (filter?.categorySlug && entry.categorySlug !== filter.categorySlug) return false
  if (filter?.type && entry.type !== filter.type) return false
  if (filter?.tagSlug && !entry.tagSlugs.includes(filter.tagSlug)) return false
  return true
}

function byPublishedDateDesc(a: KnowledgeArticleIndexEntry, b: KnowledgeArticleIndexEntry): number {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

// The one concrete KnowledgeService implementation today, built on top of
// whatever KnowledgeRepository it's given. Every method loads the
// repository's lightweight index first and filters/sorts in memory — the
// same "index first, full body only when needed" shape as ProductService,
// so nothing here changes once the repository is backed by a real BGrowth
// Studio-published Knowledge index.
export function createKnowledgeService(repository: KnowledgeRepository): KnowledgeService {
  async function listArticles(filter?: KnowledgeArticleFilter): Promise<KnowledgeArticleIndexEntry[]> {
    const index = await repository.loadArticleIndex()
    return index.filter((entry) => matchesFilter(entry, filter))
  }

  return {
    getArticleBySlug(slug) {
      return repository.loadArticle(slug)
    },

    listArticles,

    async searchArticles(query) {
      const q = query.trim().toLowerCase()
      if (!q) return []
      const index = await repository.loadArticleIndex()
      return index.filter(
        (entry) =>
          entry.title.toLowerCase().includes(q) ||
          entry.excerpt.toLowerCase().includes(q) ||
          entry.tagSlugs.some((tag) => tag.toLowerCase().includes(q)),
      )
    },

    async getLatestArticles(limit = 6) {
      const index = await repository.loadArticleIndex()
      return [...index].sort(byPublishedDateDesc).slice(0, limit)
    },

    async getFeaturedByPlacement(placement) {
      const [featured, index] = await Promise.all([repository.loadFeaturedContent(), repository.loadArticleIndex()])
      const bySlug = new Map(index.map((entry) => [entry.slug, entry]))
      return featured
        .filter((f) => f.placement === placement)
        .sort((a, b) => a.order - b.order)
        .map((f) => bySlug.get(f.articleSlug))
        .filter((entry): entry is KnowledgeArticleIndexEntry => Boolean(entry))
    },

    async getFreeResources() {
      const index = await repository.loadArticleIndex()
      return FREE_RESOURCE_TYPES.map((type) =>
        index.filter((entry) => entry.type === type).sort(byPublishedDateDesc)[0],
      ).filter((entry): entry is KnowledgeArticleIndexEntry => Boolean(entry))
    },

    async getRelatedArticles(slug, limit = 3) {
      const [article, index] = await Promise.all([repository.loadArticle(slug), repository.loadArticleIndex()])
      const relatedSlugs = article?.relatedArticleSlugs ?? []
      const bySlug = new Map(index.map((entry) => [entry.slug, entry]))
      const related = relatedSlugs.map((s) => bySlug.get(s)).filter((entry): entry is KnowledgeArticleIndexEntry => Boolean(entry))
      if (related.length >= limit || !article) return related.slice(0, limit)

      // Backfill with same-category articles if the curated list is short —
      // keeps the Article Page's Related Resources section from looking
      // sparse on an article with few explicit relations.
      const fallback = index
        .filter((entry) => entry.slug !== slug && entry.categorySlug === article.categorySlug && !relatedSlugs.includes(entry.slug))
        .sort(byPublishedDateDesc)
      return [...related, ...fallback].slice(0, limit)
    },

    async getCategories() {
      return repository.loadCategories()
    },

    async getCategoryBySlug(slug) {
      const categories = await repository.loadCategories()
      return categories.find((c) => c.slug === slug)
    },

    async getArticleCountByCategory() {
      const index = await repository.loadArticleIndex()
      const counts: Record<string, number> = {}
      for (const entry of index) counts[entry.categorySlug] = (counts[entry.categorySlug] ?? 0) + 1
      return counts
    },

    async getArticleCountByType() {
      const index = await repository.loadArticleIndex()
      const counts: Record<string, number> = {}
      for (const entry of index) counts[entry.type] = (counts[entry.type] ?? 0) + 1
      return counts
    },

    async getAuthorById(id) {
      const authors = await repository.loadAuthors()
      return authors.find((a) => a.id === id)
    },

    async getTags() {
      return repository.loadTags()
    },

    async getLearningPaths() {
      return repository.loadLearningPaths()
    },
  }
}

// Ready-to-use singleton every page/component reads through — backed by
// the mock repository today (see store/mockKnowledgeRepository.ts). A
// future BGrowth Studio integration swaps only the repository passed in
// here; every caller of `knowledgeService` stays the same.
export const knowledgeService: KnowledgeService = createKnowledgeService(createMockKnowledgeRepository())
