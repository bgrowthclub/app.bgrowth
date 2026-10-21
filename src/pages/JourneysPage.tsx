import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Route } from 'lucide-react'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import EmptyState from '../components/ui/EmptyState'
import FilterPill from '../components/ui/FilterPill'
import JourneyCard from '../components/journeys/JourneyCard'
import { journeyService } from '../modules/journeys/journeyService'
import { lifeWorldResolver } from '../modules/journeys/lifeWorld'
import { studioWorkspaceService } from '../modules/workspace/services/studioWorkspaceService'
import type { JourneySummary } from '../modules/journeys/types'
import type { PortalCategoryRow } from '../modules/workspace/types/portal'

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; journeys: JourneySummary[]; categories: PortalCategoryRow[] }

// /journeys — every published Journey (BGrowth Journeys, Portal migration
// 0066), from the database's list_journeys() only: drafts never show. Any
// number of Journeys; grouped by Life World when there is more than one.
export default function JourneysPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [world, setWorld] = useState<string>('all')
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

  const shown = world === 'all' ? placed : placed.filter((p) => p.world?.slug === world)

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO title={seo.title} description={seo.description} keywords={['bgrowth journeys', 'step by step', 'guided path', 'goals']} path="/journeys" />

      <section className="container-px mx-auto max-w-page text-center">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">Journeys</p>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">Reach your goal, one step at a time</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-navy/55">
            Each Journey breaks a goal into clear stages and actions, and points you to the right articles and tools along the way.
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
              {worlds.length > 1 && (
                <div className="mb-8 flex flex-wrap justify-center gap-2">
                  <FilterPill label="All" active={world === 'all'} onClick={() => setWorld('all')} />
                  {worlds.map(([slug, name]) => (
                    <FilterPill key={slug} label={name} active={world === slug} onClick={() => setWorld(slug)} />
                  ))}
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map(({ journey, world: w }, i) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    world={w ? { name: w.name, icon: w.icon } : undefined}
                    to={`/journeys/${journey.slug}`}
                    index={i}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
