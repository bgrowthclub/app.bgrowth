import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CalendarCheck, CheckCircle2, Clock, Route, Target, Users } from 'lucide-react'
import SEO from '../components/seo/SEO'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import JourneyNoticeBar from '../components/journeys/JourneyNoticeBar'
import JourneyLearnCard from '../components/journeys/JourneyLearnCard'
import JourneyTimeline from '../components/journeys/JourneyTimeline'
import { formatMinutes } from '../modules/journeys/estimate'
import JourneyStartPanel from '../components/journeys/JourneyStartPanel'
import { journeyService } from '../modules/journeys/journeyService'
import { lifeWorldResolver } from '../modules/journeys/lifeWorld'
import { studioWorkspaceService } from '../modules/workspace/services/studioWorkspaceService'
import type { JourneyOutline } from '../modules/journeys/types'
import type { PortalCategoryRow } from '../modules/workspace/types/portal'

type Load = { state: 'loading' } | { state: 'missing' } | { state: 'error' } | { state: 'ready'; journey: JourneyOutline; categories: PortalCategoryRow[] }

// /journeys/:slug — a published Journey's public overview (every step at
// once since 21/11/2026, JourneyTimeline): goal,
// introduction, who it's for and what you'll have at the end, the general
// notice and its stages in order (with level and estimated time when set). Read only: the
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
  const startPanel = (
    <JourneyStartPanel path={path} stageCount={journey.stages.length} actionCount={actionCount} estimatedMinutes={journey.estimatedMinutes} isFree={journey.isFree} memberPath={`/platform/journeys/${journey.slug}`} />
  )

  return (
    <div className="bg-gradient-to-b from-blue-50/50 via-bg to-bg pb-24 pt-28 md:pt-36">
      <SEO title={journey.name} description={journey.shortDescription || journey.goal} path={path} />

      <div className="container-px mx-auto max-w-page space-y-8">
        <p className="flex min-w-0 items-center gap-2 text-[14px] text-navy/55">
          <Link to="/journeys" className="inline-flex items-center gap-1.5 hover:text-primary">
            <ArrowLeft size={15} aria-hidden /> Journeys
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate font-semibold text-navy">{journey.name}</span>
        </p>

        {/* Top: what this Journey is, and how to start it */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0">
            {world && WorldIcon && (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1 text-[12.5px] font-semibold text-primary">
                <WorldIcon size={14} aria-hidden /> {world.name}
              </p>
            )}
            <h1 className="mt-4 font-display text-[32px] font-extrabold leading-tight tracking-tight text-navy md:text-[44px]">{journey.name}</h1>
            {journey.shortDescription && <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-navy/60">{journey.shortDescription}</p>}
            <p className="mt-5 flex flex-wrap gap-2 text-[13px] font-semibold">
              {journey.isFree && <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Free</span>}
              <span className="rounded-full bg-white px-3 py-1 text-navy/65 ring-1 ring-navy/10">
                {journey.stages.length} {journey.stages.length === 1 ? 'step' : 'steps'}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-navy/65 ring-1 ring-navy/10">
                {actionCount} {actionCount === 1 ? 'action' : 'actions'}
              </span>
              {journey.estimatedMinutes > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-navy/65 ring-1 ring-navy/10">
                  <Clock size={13} aria-hidden /> ~{formatMinutes(journey.estimatedMinutes)}
                </span>
              )}
            </p>
            {journey.intro && <p className="mt-6 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{journey.intro}</p>}
          </div>
          <div className="lg:sticky lg:top-28">
            {journey.coverImageUrl && (
              <img src={journey.coverImageUrl} alt="" className="mb-4 aspect-[16/9] w-full rounded-[20px] border border-navy/[0.06] object-cover shadow-softer" />
            )}
            {startPanel}
          </div>
        </section>

        {/* At a glance: who it's for, what you'll achieve, the numbers — each only when there is something to say */}
        <section>
          <h2 className="font-display text-[22px] font-bold text-navy">At a glance</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {journey.audience && (
              <div className="flex gap-4 rounded-[20px] border border-navy/[0.07] bg-white p-5 shadow-softer">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <Users size={21} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-navy">Who it’s for</p>
                  <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-navy/60">{journey.audience}</p>
                </div>
              </div>
            )}
            {journey.goal && (
              <div className="flex gap-4 rounded-[20px] border border-navy/[0.07] bg-white p-5 shadow-softer">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <Target size={21} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-navy">What you’ll achieve</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-navy/60">{journey.goal}</p>
                </div>
              </div>
            )}
            <div className="flex gap-4 rounded-[20px] border border-navy/[0.07] bg-white p-5 shadow-softer">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white">
                <CalendarCheck size={21} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-navy">Journey details</p>
                <ul className="mt-1.5 space-y-1 text-[13.5px] text-navy/65">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-primary" aria-hidden /> {journey.stages.length} {journey.stages.length === 1 ? 'step' : 'steps'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-primary" aria-hidden /> {actionCount} {actionCount === 1 ? 'action' : 'actions'}
                  </li>
                  {journey.estimatedMinutes > 0 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-primary" aria-hidden /> ~{formatMinutes(journey.estimatedMinutes)} in all
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Every step at once (21/11/2026, the owner's choice for the public page) */}
        <section>
          <h2 className="font-display text-[22px] font-bold text-navy">Your journey, step by step</h2>
          <p className="mt-1 text-[14px] text-navy/55">Start the Journey to open each resource and check off your steps.</p>
          <div className="mt-5">
            <JourneyTimeline stages={journey.stages} />
          </div>
        </section>

        <JourneyLearnCard outcomes={journey.outcomes} />
        <JourneyNoticeBar text={journey.notice} validatedStates={journey.validatedStates} />
      </div>
    </div>
  )
}
