import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import SearchToolbar from '../components/ui/SearchToolbar'
import FilterPill from '../components/ui/FilterPill'
import BusinessSystemCard from '../components/systems/BusinessSystemCard'
import EmptyState from '../components/ui/EmptyState'
import Grid from '../components/layout/Grid'
import { CATEGORIES, SYSTEMS } from '../data/systems'
import type { ComponentType } from '../types/system'

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name: A–Z', value: 'name-asc' },
]

const ALL_MODULE_TYPES: ComponentType[] = ['Planner', 'Workflow', 'Toolkit', 'Resource', 'Template', 'Guide']

export default function BrowseSystems() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') ?? 'All'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(
    (CATEGORIES as readonly string[]).includes(initialCategory) ? initialCategory : 'All',
  )
  const [moduleType, setModuleType] = useState<ComponentType | 'All'>('All')
  const [sort, setSort] = useState('featured')

  const results = useMemo(() => {
    let list = SYSTEMS.filter((s) => {
      const matchesCategory = category === 'All' || s.category === category
      const matchesModule = moduleType === 'All' || s.components.some((c) => c.type === moduleType)
      const matchesQuery =
        query.trim() === '' ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(query.toLowerCase())
      return matchesCategory && matchesModule && matchesQuery
    })

    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name-asc') return a.name.localeCompare(b.name)
      return 0 // 'featured' — catalog order
    })

    return list
  }, [query, category, moduleType, sort])

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
            {ALL_MODULE_TYPES.map((t) => (
              <FilterPill key={t} label={`${t}™`} active={moduleType === t} onClick={() => setModuleType(t)} />
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
