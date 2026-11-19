import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, GraduationCap, Play } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SearchToolbar from '../../components/ui/SearchToolbar'
import FilterPill from '../../components/ui/FilterPill'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ViewToggle from '../../components/ui/ViewToggle'
import type { CardView } from '../../components/ui/ViewToggle'
import ProductLibraryCard from '../../components/systems/ProductLibraryCard'
import WorkspaceLibraryCard from '../../components/systems/WorkspaceLibraryCard'
import Pagination from '../../components/ui/Pagination'
import { getProductActionLabel, getProductActionRoute } from '../../lib/productLibrary'
import { timeAgo } from '../../lib/timeAgo'
import MyWorkspacesTabs from '../../components/platform/MyWorkspacesTabs'
import { useOwnedProductsState } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/IdentityContext'

const SORT_OPTIONS = [
  { label: 'Recently Opened', value: 'recent' },
  { label: 'Name: A–Z', value: 'name-asc' },
  { label: 'Difficulty', value: 'difficulty' },
]

const PAGE_SIZE = 12

const DIFFICULTY_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 }

export default function MyBusinessSystemsPage() {
  const { user } = useIdentity()
  const ownedState = useOwnedProductsState(user)
  // A course has its own tab since 31/10/2026, so it isn't repeated here.
  const owned = ownedState.products.filter((p) => p.type !== 'Course')

  const industries = Array.from(new Set(owned.map((p) => p.tag)))
  const categories = Array.from(new Set(owned.map((p) => p.subTag).filter((c): c is string => Boolean(c))))
  const difficulties = Array.from(new Set(owned.map((p) => p.difficulty).filter((d): d is string => Boolean(d))))

  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('All')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [sort, setSort] = useState('recent')
  const [view, setView] = useState<CardView>('grid')
  const [page, setPage] = useState(1)

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

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const shown = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const lastOpened = [...owned]
    .filter((p) => p.lastOpenedAt && !p.expired)
    .sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''))[0]

  return (
    <div className="space-y-8">
      <SEO
        title="My Workspaces"
        description="Every Workspace you own, in one place — search, filter, and jump back in."
        path="/platform/my-systems"
      />

      <MyWorkspacesTabs />

      {/* 19/11/2026, the owner's design: pill, title and two cards with real
          numbers (Workspaces, courses); the last opened Workspace; then the
          search, sort and filters in one card. Nothing invented. */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.05] px-3 py-1 text-[12px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> Your interactive tools
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">My Workspaces</h1>
          <p className="mt-2 max-w-lg text-[15px] text-navy/55">Open any Workspace below — your work is saved as you go.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3 shadow-softer">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-primary">
              <FolderOpen size={17} aria-hidden />
            </span>
            <span>
              <span className="block text-[11.5px] text-navy/45">Workspaces</span>
              <span className="block text-[14px] font-bold text-navy">{owned.filter((p) => !p.expired).length} active</span>
            </span>
          </div>
          <Link to="/platform/courses" className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3 shadow-softer transition-colors hover:border-primary/20">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <GraduationCap size={17} aria-hidden />
            </span>
            <span>
              <span className="block text-[11.5px] text-navy/45">Courses</span>
              <span className="block text-[14px] font-bold text-navy">{ownedState.products.filter((p) => p.type === 'Course').length}</span>
            </span>
          </Link>
        </div>
      </div>

      {lastOpened && (
        <div className="flex flex-col gap-5 rounded-[20px] border border-primary/10 bg-gradient-to-br from-primary/[0.05] to-white p-5 shadow-softer sm:flex-row sm:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-grad-primary text-white">
            {lastOpened.coverImage ? <img src={lastOpened.coverImage} alt="" className="h-full w-full object-cover" /> : <lastOpened.icon size={24} aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-bold uppercase tracking-wide text-primary">Last opened</span>
              <span className="text-navy/45">{timeAgo(lastOpened.lastOpenedAt!)}</span>
            </p>
            <p className="mt-1.5 font-display text-[18px] font-bold text-navy">{lastOpened.title}</p>
            {lastOpened.description && <p className="mt-0.5 line-clamp-1 text-[13.5px] text-navy/55">{lastOpened.description}</p>}
          </div>
          <Link to={getProductActionRoute(lastOpened)} className="btn-primary inline-flex shrink-0 items-center gap-2 !px-5 !py-2.5 text-[14px]">
            <Play size={14} aria-hidden /> {getProductActionLabel(lastOpened.type)}
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-[20px] border border-navy/[0.07] bg-white p-4 shadow-softer sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex-1">
          <SearchToolbar
            query={query}
            onQueryChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            sortValue={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
            placeholder="Search Workspaces…"
          >
            {industries.length > 1 && (
              <>
                <FilterPill label={`All (${owned.length})`} active={industry === 'All'} onClick={() => { setIndustry('All'); setPage(1) }} />
                {industries.map((i) => (
                  <FilterPill key={i} label={`${i} (${owned.filter((p) => p.tag === i).length})`} active={industry === i} onClick={() => { setIndustry(i); setPage(1) }} />
                ))}
              </>
            )}
            {categories.length > 0 && (
              <>
                <FilterPill label="All Categories" active={category === 'All'} onClick={() => { setCategory('All'); setPage(1) }} />
                {categories.map((c) => (
                  <FilterPill key={c} label={c} active={category === c} onClick={() => { setCategory(c); setPage(1) }} />
                ))}
              </>
            )}
            {difficulties.length > 0 && (
              <>
                <FilterPill label="All Levels" active={difficulty === 'All'} onClick={() => { setDifficulty('All'); setPage(1) }} />
                {difficulties.map((d) => (
                  <FilterPill key={d} label={d} active={difficulty === d} onClick={() => { setDifficulty(d); setPage(1) }} />
                ))}
              </>
            )}
          </SearchToolbar>
        </div>

        <ViewToggle value={view} onChange={setView} />
      </div>

      {results.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((product, i) => (
              <WorkspaceLibraryCard key={product.slug} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {shown.map((product) => (
              <ProductLibraryCard key={product.slug} product={product} size="library" />
            ))}
          </div>
        )
      ) : (
        ownedState.status === 'loading' ? (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading your Workspaces…</p>
        ) : ownedState.status === 'error' ? (
          <EmptyState
            icon={FolderOpen}
            title="We couldn’t load your Workspaces."
            description={`Please refresh the page. If it keeps happening, send us this message: ${ownedState.error ?? 'unknown error'}`}
          />
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
        )
      )}

      {results.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-navy/[0.07] pt-5 text-[13.5px] text-navy/55 sm:flex-row">
          <p>
            Showing <strong className="text-navy">{shown.length}</strong> of <strong className="text-navy">{results.length}</strong>
          </p>
          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
