import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SectionContainer from '../../components/layout/SectionContainer'
import SectionHeader from '../../components/ui/SectionHeader'
import Grid from '../../components/layout/Grid'
import Button from '../../components/ui/Button'
import MemberBanner from '../../components/ui/MemberBanner'
import KnowledgeHero from '../../components/knowledge/KnowledgeHero'
import KnowledgeArticleCard from '../../components/knowledge/KnowledgeArticleCard'
import ContentTypeTile from '../../components/knowledge/ContentTypeTile'
import CategoryTile from '../../components/knowledge/CategoryTile'
import VideoCard from '../../components/knowledge/VideoCard'
import LearningPathCard from '../../components/knowledge/LearningPathCard'
import { KNOWLEDGE_CATEGORY_ICONS } from '../../components/knowledge/knowledgeCategoryIcons'
import { knowledgeService, FREE_RESOURCE_TYPES } from '../../modules/knowledge/services/KnowledgeService'
import { KNOWLEDGE_TYPES } from '../../modules/knowledge/types/knowledgeType'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import type { KnowledgeCategory } from '../../modules/knowledge/types/category'
import type { LearningPath } from '../../modules/knowledge/types/learningPath'

interface HomeData {
  featuredArticles: KnowledgeArticleIndexEntry[]
  featuredGuides: KnowledgeArticleIndexEntry[]
  featuredVideos: KnowledgeArticleIndexEntry[]
  freeResources: KnowledgeArticleIndexEntry[]
  latestArticles: KnowledgeArticleIndexEntry[]
  categories: KnowledgeCategory[]
  categoryCounts: Record<string, number>
  typeCounts: Record<string, number>
  learningPaths: LearningPath[]
}

const EMPTY_DATA: HomeData = {
  featuredArticles: [],
  featuredGuides: [],
  featuredVideos: [],
  freeResources: [],
  latestArticles: [],
  categories: [],
  categoryCounts: {},
  typeCounts: {},
  learningPaths: [],
}

// The Knowledge Home — nine data-driven sections in the exact order the
// Sprint spec calls for. Every section reads through knowledgeService, so a
// future BGrowth Studio-published Knowledge index changes what renders here
// without a single edit to this file.
export default function KnowledgeHomePage() {
  const navigate = useNavigate()
  const [data, setData] = useState<HomeData>(EMPTY_DATA)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      knowledgeService.getFeaturedByPlacement('featured-articles'),
      knowledgeService.getFeaturedByPlacement('featured-guides'),
      knowledgeService.getFeaturedByPlacement('featured-videos'),
      knowledgeService.getFreeResources(),
      knowledgeService.getLatestArticles(6),
      knowledgeService.getCategories(),
      knowledgeService.getArticleCountByCategory(),
      knowledgeService.getArticleCountByType(),
      knowledgeService.getLearningPaths(),
    ]).then(
      ([
        featuredArticles,
        featuredGuides,
        featuredVideos,
        freeResources,
        latestArticles,
        categories,
        categoryCounts,
        typeCounts,
        learningPaths,
      ]) => {
        if (cancelled) return
        setData({
          featuredArticles,
          featuredGuides,
          featuredVideos,
          freeResources,
          latestArticles,
          categories,
          categoryCounts,
          typeCounts,
          learningPaths,
        })
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubscribed(true)
  }

  return (
    <div className="pb-24">
      <SEO
        title="Knowledge"
        description="BGrowth Knowledge — practical business education, free resources, and expert guidance in one place."
        keywords={['business education', 'free business resources', 'business guides']}
        path="/knowledge"
      />

      <KnowledgeHero />

      {/* 1. Featured Articles */}
      {data.featuredArticles.length > 0 && (
        <SectionContainer>
          <SectionHeader eyebrow="Featured" title="Featured Articles" className="mb-10" />
          <Grid cols={3}>
            {data.featuredArticles.map((article) => (
              <KnowledgeArticleCard key={article.id} article={article} variant="featured" />
            ))}
          </Grid>
        </SectionContainer>
      )}

      {/* 2. Browse by Content Type */}
      <SectionContainer background="soft">
        <SectionHeader eyebrow="Formats" title="Browse by Content Type" className="mb-10" />
        <Grid cols={4}>
          {KNOWLEDGE_TYPES.map((type) => (
            <ContentTypeTile key={type} type={type} count={data.typeCounts[type]} />
          ))}
        </Grid>
      </SectionContainer>

      {/* 3. Featured Guides */}
      {data.featuredGuides.length > 0 && (
        <SectionContainer>
          <SectionHeader eyebrow="Guides™" title="Featured Guides" className="mb-10" />
          <Grid cols={3}>
            {data.featuredGuides.map((article) => (
              <KnowledgeArticleCard key={article.id} article={article} />
            ))}
          </Grid>
        </SectionContainer>
      )}

      {/* 4. Free Resources */}
      {data.freeResources.length > 0 && (
        <SectionContainer background="soft">
          <SectionHeader
            eyebrow="Free"
            title="Free Resources"
            description="Checklists, planners, calculators, templates, and downloads — free, no purchase required."
            className="mb-10"
          />
          <Grid cols={3}>
            {data.freeResources.map((article) => (
              <KnowledgeArticleCard key={article.id} article={article} />
            ))}
          </Grid>
        </SectionContainer>
      )}

      {/* 5. Browse by Category */}
      <SectionContainer>
        <div id="browse-categories" className="scroll-mt-28">
          <SectionHeader eyebrow="Topics" title="Browse by Category" className="mb-10" />
          <Grid cols={4}>
            {data.categories.map((category) => (
              <CategoryTile
                key={category.slug}
                slug={category.slug}
                name={category.name}
                count={data.categoryCounts[category.slug]}
                icon={KNOWLEDGE_CATEGORY_ICONS[category.slug] ?? KNOWLEDGE_CATEGORY_ICONS.Default}
              />
            ))}
            <button
              type="button"
              onClick={() => navigate('/knowledge/search')}
              className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-navy/15 bg-white p-4 text-[13.5px] font-semibold text-navy/50 transition-colors hover:border-primary/30 hover:text-primary"
            >
              More
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </Grid>
        </div>
      </SectionContainer>

      {/* 6. Latest Articles */}
      {data.latestArticles.length > 0 && (
        <SectionContainer background="soft">
          <SectionHeader
            eyebrow="Fresh"
            title="Latest Articles"
            action={
              <Button to="/knowledge/search" variant="secondary" icon={<ArrowRight size={16} />}>
                View All
              </Button>
            }
            className="mb-10"
          />
          <Grid cols={3}>
            {data.latestArticles.map((article) => (
              <KnowledgeArticleCard key={article.id} article={article} />
            ))}
          </Grid>
        </SectionContainer>
      )}

      {/* 7. Featured Videos */}
      {data.featuredVideos.length > 0 && (
        <SectionContainer>
          <SectionHeader eyebrow="Watch" title="Featured Videos" className="mb-10" />
          <Grid cols={3}>
            {data.featuredVideos.map((article) => (
              <VideoCard key={article.id} article={article} />
            ))}
          </Grid>
        </SectionContainer>
      )}

      {/* 8. Newsletter CTA */}
      <SectionContainer background="soft">
        <MemberBanner
          eyebrow="Newsletter"
          title="Get new Knowledge first."
          description="One email a month — new articles, guides, and free resources as they publish."
          footnote="No spam, unsubscribe anytime."
        >
          <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
            <Button type="submit" className="shrink-0">
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </Button>
          </form>
        </MemberBanner>
      </SectionContainer>

      {/* 9. Related Learning Paths */}
      {data.learningPaths.length > 0 && (
        <SectionContainer>
          <SectionHeader
            eyebrow="Coming Soon"
            title="Related Learning Paths"
            description="BGrowth Journeys — guided, step-by-step paths through Knowledge, built around a single goal."
            className="mb-10"
          />
          <Grid cols={3}>
            {data.learningPaths.map((path) => (
              <LearningPathCard key={path.id} path={path} />
            ))}
          </Grid>
        </SectionContainer>
      )}
    </div>
  )
}
