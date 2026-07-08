import { useMemo, useState } from 'react'
import { FolderOpen, LayoutGrid, List as ListIcon } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SearchToolbar from '../../components/ui/SearchToolbar'
import FilterPill from '../../components/ui/FilterPill'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Grid from '../../components/layout/Grid'
import OwnedSystemCard from '../../components/systems/OwnedSystemCard'
import { getOwnedSystems } from '../../data/systems'
import { PURCHASED_SLUGS } from '../../data/memberMock'

const SORT_OPTIONS = [
  { label: 'Recently Opened', value: 'recent' },
  { label: 'Name: A–Z', value: 'name-asc' },
  { label: 'Difficulty', value: 'difficulty' },
]

const DIFFICULTY_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 }

export default function MyBusinessSystemsPage() {
  const owned = getOwnedSystems(PURCHASED_SLUGS)

  const industries = Array.from(new Set(owned.map((s) => s.industry)))
  const categories = Array.from(new Set(owned.map((s) => s.category)))
  const difficulties = Array.from(new Set(owned.map((s) => s.difficulty)))

  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('All')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [sort, setSort] = useState('recent')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const results = useMemo(() => {
    const list = owned.filter((s) => {
      const matchesQuery =
        query.trim() === '' ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(query.toLowerCase())
      const matchesIndustry = industry === 'All' || s.industry === industry
      const matchesCategory = category === 'All' || s.category === category
      const matchesDifficulty = difficulty === 'All' || s.difficulty === difficulty
      return matchesQuery && matchesIndustry && matchesCategory && matchesDifficulty
    })

    return [...list].sort((a, b) => {
      if (sort === 'name-asc') return a.title.localeCompare(b.title)
      if (sort === 'difficulty') return DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
      return 0 // 'recent' — ownership order (see data/memberMock.ts)
    })
  }, [owned, query, industry, category, difficulty, sort])

  return (
    <div className="space-y-8">
      <SEO
        title="My Business Systems"
        description="Every Business System you own, in one place — search, filter, and jump back in."
        path="/platform/my-systems"
      />

      <div>
        <p className="eyebrow">Your systems</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          My Business Systems
        </h1>
        <p className="mt-3 max-w-lg text-[15px] text-navy/55">
          Continue any system below — everything runs right in your browser.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <SearchToolbar
            query={query}
            onQueryChange={setQuery}
            sortValue={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
          >
            {industries.length > 0 && (
              <>
                <FilterPill label="All Industries" active={industry === 'All'} onClick={() => setIndustry('All')} />
                {industries.map((i) => (
                  <FilterPill key={i} label={i} active={industry === i} onClick={() => setIndustry(i)} />
                ))}
              </>
            )}
            {categories.length > 0 && (
              <>
                <FilterPill label="All Categories" active={category === 'All'} onClick={() => setCategory('All')} />
                {categories.map((c) => (
                  <FilterPill key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
                ))}
              </>
            )}
            {difficulties.length > 0 && (
              <>
                <FilterPill label="All Levels" active={difficulty === 'All'} onClick={() => setDifficulty('All')} />
                {difficulties.map((d) => (
                  <FilterPill key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
                ))}
              </>
            )}
          </SearchToolbar>
        </div>

        <div className="flex shrink-0 gap-1 rounded-xl border border-navy/10 bg-white p-1 shadow-softer">
          <button
            onClick={() => setView('grid')}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
              view === 'grid' ? 'bg-bg-soft text-primary' : 'text-navy/40 hover:text-navy'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            aria-label="List view"
            aria-pressed={view === 'list'}
            className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
              view === 'list' ? 'bg-bg-soft text-primary' : 'text-navy/40 hover:text-navy'
            }`}
          >
            <ListIcon size={16} />
          </button>
        </div>
      </div>

      {results.length > 0 ? (
        view === 'grid' ? (
          <Grid cols={3}>
            {results.map((system) => (
              <OwnedSystemCard key={system.slug} system={system} />
            ))}
          </Grid>
        ) : (
          <div className="space-y-3">
            {results.map((system) => (
              <OwnedSystemCard key={system.slug} system={system} size="featured" />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={owned.length === 0 ? 'No Business Systems yet.' : 'No systems match your filters.'}
          description={
            owned.length === 0
              ? 'Browse the catalog to find your first Business System.'
              : 'Try a different keyword, industry, category, or difficulty.'
          }
          action={owned.length === 0 ? <Button to="/systems">Browse Business Systems</Button> : undefined}
        />
      )}
    </div>
  )
}
