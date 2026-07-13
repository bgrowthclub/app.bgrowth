import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import SearchToolbar from '../components/ui/SearchToolbar'
import FilterPill from '../components/ui/FilterPill'
import BusinessSystemCard from '../components/systems/BusinessSystemCard'
import { MODULE_TYPE_CONFIG } from '../components/systems/ModuleBadge'
import EmptyState from '../components/ui/EmptyState'
import Grid from '../components/layout/Grid'
import { CATEGORIES } from '../data/systems'
import { loadPublishedSystemProducts, systemForCard } from '../lib/publishedCatalog'
import type { ModuleType } from '../types/system'

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name: A–Z', value: 'name-asc' },
]

export default function BrowseSystems() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') ?? 'All'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(
    (CATEGORIES as readonly string[]).includes(initialCategory) ? initialCategory : 'All',
  )
  const [moduleType, setModuleType] = useState<ModuleType | 'All'>('All')
  const [sort, setSort] = useState('featured')

  // The Workspace Catalog — reads the Runtime↔Product Engine connection's
  // Published Product Repository (via ProductService.getPublished())
  // instead of a hardcoded catalog filter. A newly published product shows
  // up here automatically, no code change required. See
  // lib/publishedCatalog.ts.
  const [publishedSystems, setPublishedSystems] = useState<Awaited<ReturnType<typeof loadPublishedSystemProducts>>>(
    [],
  )

  useEffect(() => {
    let cancelled = false
    loadPublishedSystemProducts().then((pairs) => {
      if (!cancelled) setPublishedSystems(pairs)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Each product's own title/description/price merged onto its system —
  // see systemForCard's doc comment on why the catalog can't render
  // BusinessSystem's raw fields directly. Also gives every card a unique
  // key (the product's slug), so two products ever wrapping the same
  // Workspace render as two distinct cards, not a collapsed duplicate.
  const publishedList = useMemo(() => publishedSystems.map(systemForCard), [publishedSystems])

  // Derived from the catalog rather than a fixed list — a module type only
  // shows as a filter option if some published system actually has one.
  const allModuleTypes: ModuleType[] = useMemo(
    () => Array.from(new Set(publishedList.flatMap((s) => s.modules.map((m) => m.type)))),
    [publishedList],
  )

  const results = useMemo(() => {
    let list = publishedList.filter((s) => {
      const matchesCategory = category === 'All' || s.category === category
      const matchesModule = moduleType === 'All' || s.modules.some((m) => m.type === moduleType)
      const matchesQuery =
        query.trim() === '' ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(query.toLowerCase())
      return matchesCategory && matchesModule && matchesQuery
    })

    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name-asc') return a.title.localeCompare(b.title)
      return 0 // 'featured' — catalog order
    })

    return list
  }, [publishedList, query, category, moduleType, sort])

  const handleCategory = (c: string) => {
    setCategory(c)
    setSearchParams(c === 'All' ? {} : { category: c })
  }

  return (
    <section className="pt-36 pb-24 md:pt-44">
      <div className="container-px mx-auto max-w-page">
        <div className="max-w-2xl">
          <p className="eyebrow">Business Systems™</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Find the system built for your business.
          </h1>
        </div>

        <div className="mt-8">
          <SearchToolbar
            query={query}
            onQueryChange={setQuery}
            sortValue={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
          />
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-navy/30">Industry</span>
            {CATEGORIES.map((c) => (
              <FilterPill key={c} label={c} active={category === c} onClick={() => handleCategory(c)} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-navy/30">Module Type</span>
            <FilterPill label="All" active={moduleType === 'All'} onClick={() => setModuleType('All')} />
            {allModuleTypes.map((t) => (
              <FilterPill key={t} label={MODULE_TYPE_CONFIG[t].label} active={moduleType === t} onClick={() => setModuleType(t)} />
            ))}
          </div>
        </div>

        {results.length > 0 ? (
          <Grid cols={3} className="mt-10">
            {results.map((sys, i) => (
              <motion.div
                key={sys.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 6) * 0.06, duration: 0.5 }}
              >
                <BusinessSystemCard system={sys} />
              </motion.div>
            ))}
          </Grid>
        ) : (
          <div className="mt-16">
            <EmptyState title="No systems match your search." description="Try a different keyword, industry, or module type." />
          </div>
        )}
      </div>
    </section>
  )
}
