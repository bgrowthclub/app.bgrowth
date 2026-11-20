import { useMemo, useState } from 'react'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import Button from '../components/ui/Button'
import LifeWorldCard from '../components/systems/LifeWorldCard'
import { lifeWorldPath, useWorkspaceCategories } from '../lib/useWorkspaceCategories'

type Filter = 'all' | 'live' | 'soon'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'soon', label: 'Coming soon' },
]

// The Life Worlds hub (/workspaces; new look 20/11/2026, the owner's design):
// title, search and All / Live / Coming soon, the six worlds as cards (live
// counts from the published products — no percentages, dates or invented
// totals), and a closing band. Every card opens that world's own page
// (pages/LifeWorldPage). Same WORKSPACE_CATEGORIES as the Home's section.
export default function WorkspacesPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const worlds = useWorkspaceCategories()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return worlds.filter(
      (w) =>
        (filter === 'all' || (filter === 'live' ? w.count > 0 : w.count === 0)) &&
        (!q || w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)),
    )
  }, [query, filter, worlds])

  return (
    <div className="bg-gradient-to-b from-blue-50/50 via-bg to-bg pb-24 pt-32 md:pt-40">
      <SEO
        title={seoPage('/workspaces').title}
        description={seoPage('/workspaces').description}
        keywords={['bgrowth life worlds', 'bgrowth workspace', 'personal growth', 'business workspace']}
        path="/workspaces"
      />

      <section className="container-px mx-auto flex max-w-page flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-primary">Life Worlds</p>
          <h1 className="mt-3 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight text-navy sm:text-[52px]">Life Worlds</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-navy/60">
            Interactive workspaces for personal and professional growth. Choose a Life World to organize, learn, plan and
            accomplish.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block sm:w-64">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/35" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Life Worlds…"
              aria-label="Search Life Worlds"
              className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-11 pr-4 text-[14px] text-navy placeholder:text-navy/35 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors ${
                  filter === f.id ? 'border-primary bg-primary text-white' : 'border-navy/10 bg-white text-navy/65 hover:text-navy'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-px mx-auto mt-10 max-w-page">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((world) => (
              <LifeWorldCard key={world.slug} world={world} to={lifeWorldPath(world)} />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-navy/[0.06] bg-white p-12 text-center shadow-softer">
            <p className="font-display text-lg font-bold text-navy">No Life Worlds match your search.</p>
          </div>
        )}
      </section>

      <section className="container-px mx-auto mt-12 max-w-page">
        <div className="flex flex-col items-start gap-6 rounded-[28px] border border-primary/10 bg-gradient-to-r from-blue-50 to-white p-7 sm:flex-row sm:items-center sm:p-10">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
            <Sparkles size={28} aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-[24px] font-bold tracking-tight text-navy">Ready to achieve something new?</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-navy/60">
              Discover interactive workspaces designed to help you take action, stay organized and move confidently toward
              your goals.
            </p>
          </div>
          <Button to="/systems" icon={<ArrowRight size={16} />}>
            Explore the catalog
          </Button>
        </div>
      </section>
    </div>
  )
}
