import { useEffect, useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import PageContainer from '../../components/layout/PageContainer'
import SectionContainer from '../../components/layout/SectionContainer'
import SearchToolbar from '../../components/ui/SearchToolbar'
import FilterPill from '../../components/ui/FilterPill'
import Grid from '../../components/layout/Grid'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import KnowledgeArticleCard from '../../components/knowledge/KnowledgeArticleCard'
import { KNOWLEDGE_CATEGORY_ICONS } from '../../components/knowledge/knowledgeCategoryIcons'
import { knowledgeService } from '../../modules/knowledge/services/KnowledgeService'
import { KNOWLEDGE_TYPES } from '../../modules/knowledge/types/knowledgeType'
import type { KnowledgeType } from '../../modules/knowledge/types/knowledgeType'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import type { KnowledgeCategory } from '../../modules/knowledge/types/category'

const SORT_OPTIONS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Quickest Read', value: 'reading-time' },
]

const PAGE_SIZE = 6

export default function KnowledgeCategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<KnowledgeCategory | null | undefined>(undefined)
  const [articles, setArticles] = useState<KnowledgeArticleIndexEntry[]>([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState<KnowledgeType | 'All'>('All')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setCategory(undefined)
    Promise.all([knowledgeService.getCategoryBySlug(slug), knowledgeService.listArticles({ categorySlug: slug })]).then(
      ([foundCategory, foundArticles]) => {
        if (cancelled) return
        setCategory(foundCategory ?? null)
        setArticles(foundArticles)
      },
    )
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    setPage(1)
  }, [query, type, sort, slug])

  const results = useMemo(() => {
    let list = articles.filter((a) => {
      const matchesType = type === 'All' || a.type === type
      const matchesQuery =
        query.trim() === '' ||
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(query.toLowerCase())
      return matchesType && matchesQuery
    })

    list = [...list].sort((a, b) => {
      if (sort === 'oldest') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      if (sort === 'reading-time') return a.readingTimeMinutes - b.readingTimeMinutes
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })

    return list
  }, [articles, query, type, sort])

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const availableTypes = useMemo(
    () => KNOWLEDGE_TYPES.filter((t) => articles.some((a) => a.type === t)),
    [articles],
  )

  if (category === null) return <Navigate to="/knowledge" replace />
  if (category === undefined) return null

  const Icon = KNOWLEDGE_CATEGORY_ICONS[category.slug] ?? KNOWLEDGE_CATEGORY_ICONS.Default

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title={`${category.name} Knowledge`}
        description={category.description ?? `Articles, guides, and free resources about ${category.name}.`}
        path={`/knowledge/category/${category.slug}`}
      />

      <PageContainer>
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
            <Icon size={26} strokeWidth={1.75} />
          </div>
          <div>
            <p className="eyebrow">Knowledge™</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
              {category.name}
            </h1>
          </div>
        </div>
        {category.description && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-navy/55">{category.description}</p>
        )}
      </PageContainer>

      <SectionContainer>
        <SearchToolbar
          query={query}
          onQueryChange={setQuery}
          sortValue={sort}
          onSortChange={setSort}
          sortOptions={SORT_OPTIONS}
          placeholder={`Search ${category.name} resources…`}
        >
          <FilterPill label="All" active={type === 'All'} onClick={() => setType('All')} />
          {availableTypes.map((t) => (
            <FilterPill key={t} label={t} active={type === t} onClick={() => setType(t)} />
          ))}
        </SearchToolbar>

        {pageResults.length > 0 ? (
          <>
            <Grid cols={3} className="mt-10">
              {pageResults.map((article) => (
                <KnowledgeArticleCard key={article.id} article={article} categoryName={category.name} />
              ))}
            </Grid>
            <div className="mt-12">
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="mt-16">
            <EmptyState title="No resources match your search." description="Try a different keyword or content type." />
          </div>
        )}
      </SectionContainer>
    </div>
  )
}
