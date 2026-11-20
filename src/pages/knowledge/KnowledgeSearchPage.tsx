import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import KnowledgeSearchCard from '../../components/knowledge/KnowledgeSearchCard'
import KnowledgeTypeFilter from '../../components/knowledge/KnowledgeTypeFilter'
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

// Knowledge → Search (20/11/2026, the owner's design): a centered top with the
// search and one button per type that has articles (with its count), then
// "Showing n results", the sort (newest / oldest / quickest read — nothing is
// counted as "popular") and the results as KnowledgeSearchCard, 9 per page.
export default function KnowledgeSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState<KnowledgeType | 'All'>((searchParams.get('type') as KnowledgeType | null) ?? 'All')
  const [sort, setSort] = useState<Sort>('newest')
  const [page, setPage] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [allArticles, setAllArticles] = useState<KnowledgeArticleIndexEntry[]>([])
  const [categories, setCategories] = useState<KnowledgeCategory[]>([])
  const [tags, setTags] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let cancelled = false
    Promise.all([knowledgeService.listArticles(), knowledgeService.getCategories(), knowledgeService.getTags()]).then(([articles, cats, tagList]) => {
      if (cancelled) return
      setAllArticles(articles)
      setCategories(cats)
      setTags(new Map(tagList.map((t) => [t.slug, t.name])))
      setLoaded(true)
    })
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
  }, [query, type, sort])

  const categoryBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories])

  // What the words match, before the type button.
  const matching = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allArticles
    return allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tagSlugs.some((tag) => tag.includes(q) || (tags.get(tag) ?? '').toLowerCase().includes(q)) ||
        (categoryBySlug.get(a.categorySlug) ?? '').toLowerCase().includes(q),
    )
  }, [allArticles, query, tags, categoryBySlug])

  // Only the types that have articles at all; the count follows the words.
  const types = useMemo(() => KNOWLEDGE_TYPES.filter((t) => allArticles.some((a) => a.type === t)), [allArticles])
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

  function changePage(n: number) {
    setPage(n)
    document.getElementById('knowledge-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pb-24">
      <SEO
        title="Search Knowledge"
        description="Search every BGrowth Knowledge article, guide, checklist, template, and video."
        path="/knowledge/search"
      />

      <section className="border-b border-navy/[0.06] bg-grad-radial-soft pb-12 pt-28 md:pb-14 md:pt-36">
        <div className="container-px mx-auto max-w-3xl text-center">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-primary">
            Knowledge <ChevronRight size={12} className="text-primary/50" aria-hidden /> Search
          </p>
          <h1 className="mt-4 font-display text-[32px] font-bold leading-tight tracking-tight text-navy sm:text-[44px]">Search Knowledge</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-navy/60 sm:text-[16px]">
            Find articles and guides to help you start, run and grow — search by word, topic or tag.
          </p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              ;(document.activeElement as HTMLElement | null)?.blur()
              document.getElementById('knowledge-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="mx-auto mt-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-navy/[0.08] bg-white p-2 shadow-soft focus-within:shadow-glow"
          >
            <Search size={18} className="ml-3 shrink-0 text-navy/35" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, guides, topics…"
              aria-label="Search Knowledge"
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-navy placeholder:text-navy/35 focus:outline-none"
            />
            <button type="submit" className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white shadow-softer transition-opacity hover:opacity-95">
              Search
            </button>
          </form>

          <KnowledgeTypeFilter types={types} value={type} onChange={setType} total={matching.length} countOf={countOf} className="mt-6" />
        </div>
      </section>

      <section id="knowledge-results" className="container-px mx-auto max-w-7xl scroll-mt-24 pt-10 md:pt-12">
        {loaded && (
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
        )}

        {!loaded ? (
          <div className="min-h-[50vh]" aria-busy="true" />
        ) : pageResults.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageResults.map((article) => (
                <KnowledgeSearchCard
                  key={article.id}
                  article={article}
                  categoryName={categoryBySlug.get(article.categorySlug)}
                  tagName={article.tagSlugs[0] ? tags.get(article.tagSlugs[0]) : undefined}
                />
              ))}
            </div>
            <div className="mt-12">
              <Pagination page={page} pageCount={pageCount} onChange={changePage} />
            </div>
          </>
        ) : (
          <EmptyState title="No Knowledge matches your search." description="Try a different word, or pick another type." />
        )}
      </section>
    </div>
  )
}
