import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Clock, Flag, Route } from 'lucide-react'
import SEO from '../components/seo/SEO'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import JourneyAudience from '../components/journeys/JourneyAudience'
import JourneyNoticeBar from '../components/journeys/JourneyNoticeBar'
import JourneyLearnCard from '../components/journeys/JourneyLearnCard'
import JourneyStepList from '../components/journeys/JourneyStepList'
import { ACTION_KIND } from '../components/journeys/JourneyStagePreview'
import { formatMinutes, STAGE_LEVEL_LABEL } from '../modules/journeys/estimate'
import JourneyStartPanel from '../components/journeys/JourneyStartPanel'
import { journeyService } from '../modules/journeys/journeyService'
import { lifeWorldResolver } from '../modules/journeys/lifeWorld'
import { studioWorkspaceService } from '../modules/workspace/services/studioWorkspaceService'
import type { JourneyOutline } from '../modules/journeys/types'
import type { PortalCategoryRow } from '../modules/workspace/types/portal'

type Load = { state: 'loading' } | { state: 'missing' } | { state: 'error' } | { state: 'ready'; journey: JourneyOutline; categories: PortalCategoryRow[] }

// /journeys/:slug — a published Journey's public overview: goal,
// introduction, who it's for and what you'll have at the end, the general
// notice and its stages in order (with level and estimated time when set). Read only: the
// database returns published Journeys only, with unpublished resources
// reduced to "coming soon"/"unavailable" (no names, links or prices).
// Starting it and saving progress need a signed-in member (enforced by the
// database).
export default function JourneyPage() {
  const { slug = '' } = useParams()
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [stageId, setStageId] = useState<string | null>(null)
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
  const stage = journey.stages.find((s) => s.id === stageId) ?? journey.stages[0]
  const stageIndex = Math.max(0, journey.stages.findIndex((s) => s.id === stage?.id))
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
            {journey.goal && (
              <div className="mt-6 flex gap-3 rounded-2xl bg-primary/[0.06] p-5">
                <Flag size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">Your goal</p>
                  <p className="mt-1 text-[15.5px] font-medium leading-relaxed text-navy">{journey.goal}</p>
                </div>
              </div>
            )}
            {journey.intro && <p className="mt-6 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{journey.intro}</p>}
          </div>
          <div className="lg:sticky lg:top-28">
            {journey.coverImageUrl && (
              <img src={journey.coverImageUrl} alt="" className="mb-4 aspect-[16/9] w-full rounded-[20px] border border-navy/[0.06] object-cover shadow-softer" />
            )}
            {startPanel}
          </div>
        </section>

        {/* The steps */}
        {stage && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="min-w-0 lg:self-start">
              <JourneyStepList title="The steps" stages={journey.stages} activeId={stage.id} onSelect={setStageId} />
            </div>
            <div className="min-w-0 rounded-[24px] border border-navy/[0.07] bg-white p-6 shadow-softer sm:p-8">
              <p className="w-fit rounded-lg bg-blue-50 px-3 py-1.5 text-[13.5px] font-semibold text-primary">
                Step {stageIndex + 1}
                {stage.level ? ` · ${STAGE_LEVEL_LABEL[stage.level]}` : ''}
              </p>
              <h2 className="mt-4 font-display text-[26px] font-bold leading-tight text-navy md:text-[30px]">{stage.title || `Stage ${stageIndex + 1}`}</h2>
              {stage.summary && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-navy/65">{stage.summary}</p>}
              {stage.estimatedMinutes > 0 && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-navy/55">
                  <Clock size={16} aria-hidden /> ~{formatMinutes(stage.estimatedMinutes)}
                </p>
              )}
              <ul className="mt-6 space-y-2.5">
                {stage.actions.map((action) => {
                  const kind = ACTION_KIND[action.kind]
                  const Icon = kind.icon
                  return (
                    <li key={action.id} className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] px-4 py-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
                        <Icon size={18} aria-label={kind.label} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-semibold text-navy">{action.title}</span>
                        <span className="block text-[12.5px] text-navy/45">
                          {kind.label}
                          {action.estimatedMinutes != null ? ` · ${formatMinutes(action.estimatedMinutes)}` : ''}
                          {action.optional ? ' · Optional' : ''}
                          {action.states.length > 0 ? ` · ${action.states.join(', ')} only` : ''}
                        </span>
                      </span>
                      {action.state === 'coming_soon' && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Coming soon</span>}
                      {action.state === 'unavailable' && <span className="shrink-0 rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-semibold text-navy/45">Unavailable</span>}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-5 text-[13px] text-navy/50">Start the Journey to open each resource and check off your steps.</p>
            </div>
          </section>
        )}

        <JourneyLearnCard outcomes={journey.outcomes} />
        {journey.audience && <JourneyAudience audience={journey.audience} outcomes={[]} />}
        <JourneyNoticeBar text={journey.notice} validatedStates={journey.validatedStates} />
      </div>
    </div>
  )
}
