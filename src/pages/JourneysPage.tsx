import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Clock, ListChecks, Route, Search, Zap } from 'lucide-react'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import EmptyState from '../components/ui/EmptyState'
import JourneyCatalogCard from '../components/journeys/JourneyCatalogCard'
import { journeyService } from '../modules/journeys/journeyService'
import { lifeWorldResolver } from '../modules/journeys/lifeWorld'
import { studioWorkspaceService } from '../modules/workspace/services/studioWorkspaceService'
import type { JourneySummary } from '../modules/journeys/types'
import type { PortalCategoryRow } from '../modules/workspace/types/portal'

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; journeys: JourneySummary[]; categories: PortalCategoryRow[] }

// /journeys — every published Journey (BGrowth Journeys, Portal migration
// 0068), from the database's list_journeys() only: drafts never show. Any
// number of Journeys; grouped by Life World when there is more than one.
export default function JourneysPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [world, setWorld] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'newest' | 'shortest' | 'name'>('newest')
  const seo = seoPage('/journeys')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      journeyService.listJourneys(),
      // The Life World label is a nicety: no categories = no labels.
      studioWorkspaceService.listCategories().catch(() => [] as PortalCategoryRow[]),
    ])
      .then(([journeys, categories]) => !cancelled && setLoad({ state: 'ready', journeys, categories }))
      .catch(() => !cancelled && setLoad({ state: 'error' }))
    return () => {
      cancelled = true
    }
  }, [])

  const placed = useMemo(() => {
    if (load.state !== 'ready') return []
    const worldOf = lifeWorldResolver(load.categories)
    return load.journeys.map((journey) => ({ journey, world: worldOf(journey.categoryId) }))
  }, [load])

  const worlds = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of placed) if (p.world) seen.set(p.world.slug, p.world.name)
    return [...seen.entries()]
  }, [placed])

  const q = query.trim().toLowerCase()
  const shown = (world === 'all' ? placed : placed.filter((p) => p.world?.slug === world))
    .filter(({ journey }) => !q || `${journey.name} ${journey.shortDescription} ${journey.audience}`.toLowerCase().includes(q))
    .sort((a, b) =>
      sort === 'name'
        ? a.journey.name.localeCompare(b.journey.name)
        : sort === 'shortest'
          ? (a.journey.estimatedMinutes || Infinity) - (b.journey.estimatedMinutes || Infinity)
          : (b.journey.publishedAt ?? '').localeCompare(a.journey.publishedAt ?? ''),
    )
  const chip = (active: boolean) =>
    `rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors ${
      active ? 'bg-primary text-white shadow-softer' : 'border border-navy/10 bg-white text-navy/65 hover:border-primary/25 hover:text-navy'
    }`

  return (
    // 19/11/2026, the owner's design: centered top with a pill and three true
    // facts, then search/sort/Life World chips in one card, the new cards, and
    // a closing band. Nothing invented: every number comes from the Journeys.
    <div className="pb-24">
      <SEO title={seo.title} description={seo.description} keywords={['bgrowth journeys', 'step by step', 'guided path', 'goals']} path="/journeys" />

      <section className="relative overflow-hidden border-b border-navy/[0.06] bg-grad-radial-soft pb-14 pt-32 md:pb-16 md:pt-40">
        <div className="container-px mx-auto max-w-3xl text-center">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary">
            <Route size={13} aria-hidden /> BGrowth guided paths
          </p>
          <h1 className="mt-5 font-display text-[34px] font-extrabold leading-[1.1] tracking-tight text-navy sm:text-[46px] md:text-[54px]">
            Reach your goal, <span className="text-primary">one step at a time.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-navy/60">
            Each Journey breaks a goal into clear stages and actions, and points you to the right articles, tools and Workspaces along the way.
          </p>
          <p className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] text-navy/60">
            <span className="inline-flex items-center gap-1.5"><ListChecks size={15} className="text-primary" aria-hidden /> Stage by stage</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" aria-hidden /> Practical actions</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={15} className="text-violet-500" aria-hidden /> Time estimates</span>
          </p>
        </div>
      </section>

      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          {load.state === 'loading' && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading Journeys">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl2 border border-navy/[0.06] bg-white shadow-softer" />
              ))}
            </div>
          )}

          {load.state === 'error' && (
            <EmptyState icon={AlertCircle} title="Journeys couldn’t load" description="Please try again in a moment." />
          )}

          {load.state === 'ready' && load.journeys.length === 0 && (
            <EmptyState icon={Route} title="No Journeys yet" description="The first guided Journeys are on their way." />
          )}

          {load.state === 'ready' && load.journeys.length > 0 && (
            <>
              <div id="journeys" className="mb-8 scroll-mt-28 rounded-[22px] border border-navy/[0.07] bg-white p-4 shadow-softer sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex flex-1 items-center gap-2 rounded-xl border border-navy/10 px-3.5 py-2.5 focus-within:border-primary/30">
                    <Search size={16} className="text-navy/35" aria-hidden />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Journeys (e.g. Notary, Cleaning)…" aria-label="Search Journeys" className="min-w-0 flex-1 bg-transparent text-[14px] text-navy placeholder:text-navy/35 focus:outline-none" />
                  </label>
                  <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort" className="rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-[14px] font-medium text-navy">
                    <option value="newest">Newest</option>
                    <option value="shortest">Shortest first</option>
                    <option value="name">Name: A–Z</option>
                  </select>
                </div>
                {worlds.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-navy/[0.06] pt-4">
                    <button type="button" onClick={() => setWorld('all')} className={chip(world === 'all')}>
                      All Journeys ({placed.length})
                    </button>
                    {worlds.map(([slug, name]) => (
                      <button key={slug} type="button" onClick={() => setWorld(slug)} className={chip(world === slug)}>
                        {name} ({placed.filter((p) => p.world?.slug === slug).length})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map(({ journey, world: w }) => (
                  <JourneyCatalogCard key={journey.id} journey={journey} worldName={w?.name} />
                ))}
              </div>
              {shown.length === 0 && <EmptyState icon={Route} title="No Journey matches your search" description="Try another word or Life World." />}

              <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[28px] bg-grad-primary px-6 py-10 text-white shadow-glow sm:px-10 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                    <Zap size={12} aria-hidden /> How it works
                  </p>
                  <h2 className="mt-4 font-display text-[24px] font-bold sm:text-[28px]">How BGrowth Journeys™ work</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/80">
                    Each stage points you to the articles, tools and Workspaces for that moment, so you spend your time doing — not searching.
                  </p>
                </div>
                <a href="#journeys" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-[14.5px] font-semibold text-primary">
                  Choose your first Journey <ArrowRight size={16} aria-hidden />
                </a>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
