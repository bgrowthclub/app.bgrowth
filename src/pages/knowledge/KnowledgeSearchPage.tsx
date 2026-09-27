import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import PageContainer from '../../components/layout/PageContainer'
import SectionContainer from '../../components/layout/SectionContainer'
import SearchBar from '../../components/ui/SearchBar'
import FilterPill from '../../components/ui/FilterPill'
import Grid from '../../components/layout/Grid'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import KnowledgeArticleCard from '../../components/knowledge/KnowledgeArticleCard'
import { knowledgeService } from '../../modules/knowledge/services/KnowledgeService'
import type { KnowledgeType } from '../../modules/knowledge/types/knowledgeType'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import type { KnowledgeCategory } from '../../modules/knowledge/types/category'

// The tab set the Sprint spec calls out by name. A query-string `type` that
// isn't one of these (Planner, Calculator — reached via the Knowledge
// Home's "Browse by Content Type" tiles) still filters results correctly;
// it just won't have its own highlighted tab, matching the spec's literal
// tab list without dropping support for every KnowledgeType.
const TABS: { label: string; value: KnowledgeType | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Articles', value: 'Article' },
  { label: 'Guides', value: 'Guide' },
  { label: 'Downloads', value: 'Download' },
  { label: 'Templates', value: 'Template' },
  { label: 'Videos', value: 'Video' },
  { label: 'Checklists', value: 'Checklist' },
]

const PAGE_SIZE = 9

export default function KnowledgeSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = (searchParams.get('type') as KnowledgeType | null) ?? 'All'
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState<KnowledgeType | 'All'>(initialType)
  const [page, setPage] = useState(1)
  const [allArticles, setAllArticles] = useState<KnowledgeArticleIndexEntry[]>([])
  const [categories, setCategories] = useState<KnowledgeCategory[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([knowledgeService.listArticles(), knowledgeService.getCategories()]).then(
      ([articles, cats]) => {
        if (cancelled) return
        setAllArticles(articles)
        setCategories(cats)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const next: Record<string, string> = {}
    if (query) next.q = query
    if (type !== 'All') next.type = type
    setSearchParams(next, { replace: true })
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type])

  const categoryBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allArticles.filter((a) => {
      const matchesType = type === 'All' || a.type === type
      const matchesQuery =
        q === '' ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tagSlugs.some((tag) => tag.toLowerCase().includes(q))
      return matchesType && matchesQuery
    })
  }, [allArticles, query, type])

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="Search Knowledge"
        description="Search every BGrowth Knowledge article, guide, checklist, calculator, template, and video."
        path="/knowledge/search"
      />

      <PageContainer>
        <p className="eyebrow">Knowledge™</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Search Knowledge
        </h1>

        <div className="mt-8 max-w-2xl">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search articles, guides, checklists, calculators…"
            size="lg"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <FilterPill key={tab.label} label={tab.label} active={type === tab.value} onClick={() => setType(tab.value)} />
          ))}
        </div>
      </PageContainer>

      <SectionContainer>
        {pageResults.length > 0 ? (
          <>
            <p className="mb-6 text-[13px] font-medium text-navy/40">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            <Grid cols={3}>
              {pageResults.map((article) => (
                <KnowledgeArticleCard
                  key={article.id}
                  article={article}
                  categoryName={categoryBySlug.get(article.categorySlug)}
                />
              ))}
            </Grid>
            <div className="mt-12">
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState title="No Knowledge matches your search." description="Try a different keyword or content type." />
        )}
      </SectionContainer>
    </div>
  )
}
