import type { KnowledgeRepository } from '../services/KnowledgeRepository'
import { MOCK_ARTICLES } from '../mock/mockArticles'
import { MOCK_CATEGORIES } from '../mock/mockCategories'
import { MOCK_AUTHORS } from '../mock/mockAuthors'
import { MOCK_TAGS } from '../mock/mockTags'
import { MOCK_FEATURED_CONTENT } from '../mock/mockFeaturedContent'
import { MOCK_LEARNING_PATHS } from '../mock/mockLearningPaths'

// The one concrete KnowledgeRepository today — reads the local mock/
// arrays. Standing in for a future RemoteKnowledgeRepository backed by a
// BGrowth Studio-published Knowledge index (see KnowledgeRepository.ts).
export function createMockKnowledgeRepository(): KnowledgeRepository {
  return {
    async loadArticleIndex() {
      return MOCK_ARTICLES.map(
        ({ id, slug, title, excerpt, type, categorySlug, tagSlugs, authorId, publishedAt, readingTimeMinutes, featured }) => ({
          id,
          slug,
          title,
          excerpt,
          type,
          categorySlug,
          tagSlugs,
          authorId,
          publishedAt,
          readingTimeMinutes,
          featured,
        }),
      )
    },

    async loadArticle(slug) {
      return MOCK_ARTICLES.find((a) => a.slug === slug)
    },

    async loadCategories() {
      return MOCK_CATEGORIES
    },

    async loadAuthors() {
      return MOCK_AUTHORS
    },

    async loadTags() {
      return MOCK_TAGS
    },

    async loadFeaturedContent() {
      return MOCK_FEATURED_CONTENT
    },

    async loadLearningPaths() {
      return MOCK_LEARNING_PATHS
    },
  }
}
