import { useMemo, useState } from 'react'
import { FolderOpen, LayoutGrid, List as ListIcon } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SearchToolbar from '../../components/ui/SearchToolbar'
import FilterPill from '../../components/ui/FilterPill'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Grid from '../../components/layout/Grid'
import ProductLibraryCard from '../../components/systems/ProductLibraryCard'
import { getUserProducts } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

const SORT_OPTIONS = [
  { label: 'Recently Opened', value: 'recent' },
  { label: 'Name: A–Z', value: 'name-asc' },
  { label: 'Difficulty', value: 'difficulty' },
]

const DIFFICULTY_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 }

export default function MyBusinessSystemsPage() {
  const { user } = useIdentity()
  const owned = user ? getUserProducts(user) : []

  const industries = Array.from(new Set(owned.map((p) => p.tag)))
  const categories = Array.from(new Set(owned.map((p) => p.subTag).filter((c): c is string => Boolean(c))))
  const difficulties = Array.from(new Set(owned.map((p) => p.difficulty).filter((d): d is string => Boolean(d))))

  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('All')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [sort, setSort] = useState('recent')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const results = useMemo(() => {
    const list = owned.filter((p) => {
      const matchesQuery =
        query.trim() === '' ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      const matchesIndustry = industry === 'All' || p.tag === industry
      const matchesCategory = category === 'All' || p.subTag === category
      const matchesDifficulty = difficulty === 'All' || p.difficulty === difficulty
      return matchesQuery && matchesIndustry && matchesCategory && matchesDifficulty
    })

    return [...list].sort((a, b) => {
      if (sort === 'name-asc') return a.title.localeCompare(b.title)
      if (sort === 'difficulty') {
        return (DIFFICULTY_ORDER[a.difficulty ?? ''] ?? 0) - (DIFFICULTY_ORDER[b.difficulty ?? ''] ?? 0)
      }
      // 'recent' — most recently opened first; never-opened products fall
      // back to their purchase date, so they still sort sensibly.
      const aTime = a.lastOpenedAt ?? a.purchase.createdAt
      const bTime = b.lastOpenedAt ?? b.purchase.createdAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }, [owned, query, industry, category, difficulty, sort])

  return (
    <div className="space-y-8">
      <SEO
        title="My Workspaces"
        description="Every Workspace you own, in one place — search, filter, and jump back in."
        path="/platform/my-systems"
      />

      <div>
        <p className="eyebrow">Your Workspaces</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          My Workspaces
        </h1>
        <p className="mt-3 max-w-lg text-[15px] text-navy/55">
          Continue any Workspace below — everything runs right in your browser.
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
            placeholder="Search Workspaces…"
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
            {results.map((product) => (
              <ProductLibraryCard key={product.slug} product={product} size="library" />
            ))}
          </Grid>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {results.map((product) => (
              <ProductLibraryCard key={product.slug} product={product} size="library" />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={owned.length === 0 ? 'No Workspaces yet.' : 'No Workspaces match your filters.'}
          description={
            owned.length === 0
              ? 'Browse the catalog to find your first Workspace.'
              : 'Try a different keyword, industry, category, or difficulty.'
          }
          action={owned.length === 0 ? <Button to="/systems">Browse Workspaces</Button> : undefined}
        />
      )}
    </div>
  )
}
