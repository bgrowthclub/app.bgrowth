// A future BGrowth Journey — an ordered sequence of KnowledgeArticles
// guiding a member from a goal to a result (e.g. "Start a Cleaning
// Business, step by step"). Modeled now so the Knowledge Home's "Related
// Learning Paths" section has a real, typed data source to read from
// rather than hardcoded JSX — `comingSoon` lets the section render an
// honest preview without a real Journeys product behind it yet.
export interface LearningPath {
  id: string
  slug: string
  title: string
  description: string
  articleSlugs: string[]
  comingSoon?: boolean
}
