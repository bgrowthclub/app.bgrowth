import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Flag, Route } from 'lucide-react'
import SEO from '../components/seo/SEO'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import JourneyNotice from '../components/journeys/JourneyNotice'
import JourneyStagePreview from '../components/journeys/JourneyStagePreview'
import JourneyStartPanel from '../components/journeys/JourneyStartPanel'
import { journeyService } from '../modules/journeys/journeyService'
import { lifeWorldResolver } from '../modules/journeys/lifeWorld'
import { studioWorkspaceService } from '../modules/workspace/services/studioWorkspaceService'
import type { JourneyOutline } from '../modules/journeys/types'
import type { PortalCategoryRow } from '../modules/workspace/types/portal'

type Load = { state: 'loading' } | { state: 'missing' } | { state: 'error' } | { state: 'ready'; journey: JourneyOutline; categories: PortalCategoryRow[] }

// /journeys/:slug — a published Journey's public overview: goal,
// introduction, the general notice and its stages in order. Read only: the
// database returns published Journeys only, with unpublished resources
// reduced to "coming soon"/"unavailable" (no names, links or prices).
// Starting it and saving progress need a signed-in member (enforced by the
// database).
export default function JourneyPage() {
  const { slug = '' } = useParams()
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const path = `/journeys/${slug}`

  useEffect(() => {
    let cancelled = false
    setLoad({ state: 'loading' })
    Promise.all([journeyService.getOutline(slug), studioWorkspaceService.listCategories().catch(() => [] as PortalCategoryRow[])])
      .then(([journey, categories]) => {
        if (cancelled) return
        // Only free Journeys can be started today (paid ones aren't built).
        setLoad(journey && journey.isFree ? { state: 'ready', journey, categories } : { state: 'missing' })
      })
      .catch(() => !cancelled && setLoad({ state: 'error' }))
    return () => {
      cancelled = true
    }
  }, [slug])

  const world = useMemo(() => (load.state === 'ready' ? lifeWorldResolver(load.categories)(load.journey.categoryId) : undefined), [load])

  if (load.state === 'loading') {
    return (
      <div className="container-px mx-auto max-w-page pb-24 pt-32 md:pt-40" aria-busy="true" aria-label="Loading the Journey">
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-white" />
        <div className="mt-4 h-5 w-1/2 animate-pulse rounded-xl bg-white" />
        <div className="mt-10 h-64 animate-pulse rounded-xl3 bg-white" />
      </div>
    )
  }

  if (load.state !== 'ready') {
    return (
      <div className="container-px mx-auto max-w-2xl pb-24 pt-32 md:pt-40">
        <SEO title="Journey not available" description="This Journey isn’t available." path={path} />
        <EmptyState
          icon={load.state === 'error' ? AlertCircle : Route}
          title={load.state === 'error' ? 'This Journey couldn’t load' : 'This Journey isn’t available'}
          description={load.state === 'error' ? 'Please try again in a moment.' : 'It may have moved or isn’t published yet.'}
          action={<Button to="/journeys">See all Journeys</Button>}
        />
      </div>
    )
  }

  const { journey } = load
  const actionCount = journey.stages.reduce((n, s) => n + s.actions.length, 0)
  const WorldIcon = world?.icon

  return (
    <div className="pb-24 pt-28 md:pt-36">
      <SEO title={journey.name} description={journey.shortDescription || journey.goal} path={path} />

      <div className="container-px mx-auto max-w-page">
        <Link to="/journeys" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-navy/50 hover:text-primary">
          <ArrowLeft size={15} /> All Journeys
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <div className="min-w-0">
            {world && WorldIcon && (
              <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-primary">
                <WorldIcon size={14} aria-hidden /> {world.name}
              </p>
            )}
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">{journey.name}</h1>
            {journey.shortDescription && <p className="mt-3 text-[16px] leading-relaxed text-navy/60">{journey.shortDescription}</p>}

            {journey.coverImageUrl && (
              <img src={journey.coverImageUrl} alt="" className="mt-7 aspect-[16/8] w-full rounded-xl3 border border-navy/[0.06] object-cover shadow-softer" />
            )}

            {journey.goal && (
              <div className="mt-7 flex gap-3 rounded-xl2 bg-primary/[0.06] p-5">
                <Flag size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">Your goal</p>
                  <p className="mt-1 text-[15.5px] font-medium leading-relaxed text-navy">{journey.goal}</p>
                </div>
              </div>
            )}

            {journey.intro && <p className="mt-7 whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{journey.intro}</p>}

            <div className="mt-7">
              <JourneyNotice text={journey.notice} validatedStates={journey.validatedStates} />
            </div>

            {/* On phones the start box comes right here, before the stages. */}
            <div className="mt-7 lg:hidden">
              <JourneyStartPanel path={path} stageCount={journey.stages.length} actionCount={actionCount} isFree={journey.isFree} />
            </div>

            <h2 className="mt-12 font-display text-2xl font-bold tracking-tight text-navy">The stages</h2>
            <div className="mt-5">
              <JourneyStagePreview stages={journey.stages} />
            </div>
          </div>

          <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            <JourneyStartPanel path={path} stageCount={journey.stages.length} actionCount={actionCount} isFree={journey.isFree} />
          </aside>
        </div>
      </div>
    </div>
  )
}
