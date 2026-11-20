import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import KnowledgeSearchCard from '../../components/knowledge/KnowledgeSearchCard'
import KnowledgeTypeFilter from '../../components/knowledge/KnowledgeTypeFilter'
import { knowledgeCategoryLook } from '../../components/knowledge/knowledgeCategoryIcons'
import { knowledgeService } from '../../modules/knowledge/services/KnowledgeService'
import { KNOWLEDGE_TYPES, type KnowledgeType } from '../../modules/knowledge/types/knowledgeType'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import type { KnowledgeCategory } from '../../modules/knowledge/types/category'

type Sort = 'newest' | 'oldest' | 'quickest'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'quickest', label: 'Quickest read' },
]

const PAGE_SIZE = 9

// A Knowledge category (20/11/2026, in the look of Knowledge → Search, the
// owner's go-ahead): a centered top with the category's icon, name, its own
// description when it has one and how many articles it holds (counted), a
// search inside it and the type buttons; then the results as
// KnowledgeSearchCard, 9 per page, and the other categories to move on to.
export default function KnowledgeCategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<KnowledgeCategory | null | undefined>(undefined)
  const [articles, setArticles] = useState<KnowledgeArticleIndexEntry[]>([])
  const [others, setOthers] = useState<{ category: KnowledgeCategory; count: number }[]>([])
  const [tags, setTags] = useState<Map<string, string>>(new Map())
  const [query, setQuery] = useState('')
  const [type, setType] = useState<KnowledgeType | 'All'>('All')
  const [sort, setSort] = useState<Sort>('newest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setCategory(undefined)
    setQuery('')
    setType('All')
    Promise.all([
      knowledgeService.getCategories(),
      knowledgeService.listArticles({ categorySlug: slug }),
      knowledgeService.getArticleCountByCategory(),
      knowledgeService.getTags(),
    ]).then(([all, found, counts, tagList]) => {
      if (cancelled) return
      setCategory(all.find((c) => c.slug === slug) ?? null)
      setArticles(found)
      setOthers(
        all
          .filter((c) => c.slug !== slug && counts[c.slug])
          .map((c) => ({ category: c, count: counts[c.slug] }))
          .sort((a, b) => b.count - a.count),
      )
      setTags(new Map(tagList.map((t) => [t.slug, t.name])))
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    setPage(1)
  }, [query, type, sort, slug])

  const matching = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return articles
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tagSlugs.some((tag) => tag.includes(q) || (tags.get(tag) ?? '').toLowerCase().includes(q)),
    )
  }, [articles, query, tags])

  const types = useMemo(() => KNOWLEDGE_TYPES.filter((t) => articles.some((a) => a.type === t)), [articles])
  const countOf = (t: KnowledgeType) => matching.filter((a) => a.type === t).length

  const results = useMemo(() => {
    const list = type === 'All' ? matching : matching.filter((a) => a.type === type)
    return [...list].sort((a, b) => {
      if (sort === 'quickest') return a.readingTimeMinutes - b.readingTimeMinutes
      const diff = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      return sort === 'oldest' ? diff : -diff
    })
  }, [matching, type, sort])

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (category === null) return <Navigate to="/knowledge" replace />
  // While it loads, hold the screen so the footer doesn't jump up under the menu.
  if (category === undefined) return <div className="min-h-screen" aria-busy="true" />

  const { icon: Icon, tone } = knowledgeCategoryLook(category.slug)

  function changePage(n: number) {
    setPage(n)
    document.getElementById('category-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pb-24">
      <SEO
        title={`${category.name} Knowledge`}
        description={category.description ?? `Articles, guides, and free resources about ${category.name}.`}
        path={`/knowledge/category/${category.slug}`}
      />

      <section className="border-b border-navy/[0.06] bg-grad-radial-soft pb-12 pt-28 md:pb-14 md:pt-36">
        <div className="container-px mx-auto max-w-3xl text-center">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-primary">
            <Link to="/knowledge" className="hover:underline">
              Knowledge
            </Link>
            <ChevronRight size={12} className="text-primary/50" aria-hidden /> Category
          </p>
          <span className={`mx-auto mt-5 grid h-14 w-14 place-items-center rounded-2xl shadow-softer ${tone}`}>
            <Icon size={26} strokeWidth={1.8} aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-[30px] font-bold leading-tight tracking-tight text-navy sm:text-[42px]">{category.name}</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-navy/60 sm:text-[16px]">
            {category.description ?? `Articles and guides about ${category.name}.`}
          </p>
          <p className="mt-2 text-[13.5px] font-semibold text-navy/45">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </p>

          {articles.length > 0 && (
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                ;(document.activeElement as HTMLElement | null)?.blur()
                document.getElementById('category-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="mx-auto mt-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-navy/[0.08] bg-white p-2 shadow-soft focus-within:shadow-glow"
            >
              <Search size={18} className="ml-3 shrink-0 text-navy/35" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search in ${category.name}…`}
                aria-label={`Search in ${category.name}`}
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-navy placeholder:text-navy/35 focus:outline-none"
              />
              <button type="submit" className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white shadow-softer transition-opacity hover:opacity-95">
                Search
              </button>
            </form>
          )}

          <KnowledgeTypeFilter types={types} value={type} onChange={setType} total={matching.length} countOf={countOf} className="mt-6" />
        </div>
      </section>

      <section id="category-results" className="container-px mx-auto max-w-7xl scroll-mt-24 pt-10 md:pt-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-navy/[0.06] pb-5">
          <p className="text-[14px] text-navy/60">
            Showing <span className="font-bold text-primary">{results.length}</span> {results.length === 1 ? 'result' : 'results'}
            {query.trim() && (
              <>
                {' '}
                for <span className="font-semibold text-navy">“{query.trim()}”</span>
              </>
            )}
          </p>
          <label className="flex items-center gap-2 text-[13px] text-navy/50">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-[13.5px] font-semibold text-navy focus:border-primary/40 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {pageResults.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageResults.map((article) => (
                <KnowledgeSearchCard
                  key={article.id}
                  article={article}
                  categoryName={category.name}
                  tagName={article.tagSlugs[0] ? tags.get(article.tagSlugs[0]) : undefined}
                />
              ))}
            </div>
            <div className="mt-12">
              <Pagination page={page} pageCount={pageCount} onChange={changePage} />
            </div>
          </>
        ) : (
          <EmptyState title="Nothing here matches your search." description="Try a different word, or pick another type." />
        )}
      </section>

      {others.length > 0 && (
        <section className="container-px mx-auto max-w-7xl pt-16 md:pt-20">
          <div className="rounded-[24px] border border-navy/[0.07] bg-white p-6 text-center shadow-softer sm:p-8">
            <h2 className="font-display text-[20px] font-bold text-navy sm:text-[22px]">Explore other topics</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {others.map(({ category: c, count }) => {
                const look = knowledgeCategoryLook(c.slug)
                const OtherIcon = look.icon
                return (
                  <Link
                    key={c.slug}
                    to={`/knowledge/category/${c.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-navy/75 transition-colors hover:border-primary/25 hover:text-navy"
                  >
                    <span className={`grid h-6 w-6 place-items-center rounded-md ${look.tone}`}>
                      <OtherIcon size={14} aria-hidden />
                    </span>
                    {c.name} <span className="text-navy/40">({count})</span>
                  </Link>
                )
              })}
            </div>
            <Link to="/knowledge/search" className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary hover:underline">
              Search everything <ChevronRight size={14} aria-hidden />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
