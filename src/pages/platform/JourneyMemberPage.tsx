import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Clock, PartyPopper, Route } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import JourneyNoticeBar from '../../components/journeys/JourneyNoticeBar'
import JourneyLearnCard from '../../components/journeys/JourneyLearnCard'
import JourneyStepList from '../../components/journeys/JourneyStepList'
import JourneyActionCard from '../../components/journeys/JourneyActionCard'
import { formatMinutes, STAGE_LEVEL_LABEL } from '../../modules/journeys/estimate'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { journeyService } from '../../modules/journeys/journeyService'
import { canMark } from '../../modules/journeys/progress'
import { actionAccess, lockedProductIds } from '../../modules/journeys/resourceAccess'
import type { MemberAccess } from '../../modules/journeys/resourceAccess'
import { useJourneyProgress } from '../../modules/journeys/useJourneyProgress'
import { studioWorkspaceService } from '../../modules/workspace/services/studioWorkspaceService'
import type { JourneyOutline } from '../../modules/journeys/types'

type Load = { state: 'loading' } | { state: 'missing' } | { state: 'error' } | { state: 'ready'; journey: JourneyOutline }

const NO_ACCESS: MemberAccess = { licenses: [], grants: [], includedPlan: {} }

// /platform/journeys/:slug — the signed-in member's Journey: start it once,
// tick and untick actions, see progress overall and per stage, pick up where
// they left off, and the completion screen. Progress is their own
// workspace_instances row (Portal migration 0068). Each resource shows what
// THIS member can do with it — the Journey itself opens nothing.
export default function JourneyMemberPage() {
  const { slug = '' } = useParams()
  const { user } = useIdentity()
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [access, setAccess] = useState<MemberAccess>(NO_ACCESS)
  const [stageId, setStageId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoad({ state: 'loading' })
    journeyService
      .getOutline(slug)
      .then((journey) => !cancelled && setLoad(journey && journey.isFree ? { state: 'ready', journey } : { state: 'missing' }))
      .catch(() => !cancelled && setLoad({ state: 'error' }))
    return () => {
      cancelled = true
    }
  }, [slug])

  const journey = load.state === 'ready' ? load.journey : null
  const { state, summary, start, starting, toggle, completeStage, saving, saveError } = useJourneyProgress(journey, user?.id)

  // What this member can open: licenses, team access, plan (same rule as the
  // rest of the site); and, for paid products they can't open, which plan
  // includes them (only when the database says so).
  useEffect(() => {
    if (!journey || !user) return
    let cancelled = false
    Promise.all([studioWorkspaceService.listLicenses(user.id), studioWorkspaceService.listAccessGrants(user.id)])
      .then(async ([licenses, grants]) => {
        const ids = lockedProductIds(journey.stages.flatMap((s) => s.actions), { licenses, grants })
        const plans = await Promise.all(ids.map((id) => studioWorkspaceService.getIncludedPlan(id).catch(() => null)))
        if (!cancelled) setAccess({ licenses, grants, includedPlan: Object.fromEntries(ids.map((id, i) => [id, plans[i]])) })
      })
      .catch(() => !cancelled && setAccess(NO_ACCESS))
    return () => {
      cancelled = true
    }
  }, [journey, user])

  // Open the stage to pick up from, once.
  useEffect(() => {
    if (!stageId && summary?.resumeStageId) setStageId(summary.resumeStageId)
    else if (!stageId && journey?.stages[0]) setStageId(journey.stages[0].id)
  }, [stageId, summary, journey])

  const stageProgress = useMemo(() => new Map((summary?.stages ?? []).map((s) => [s.stageId, s])), [summary])

  if (load.state === 'loading') return <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
  if (load.state !== 'ready' || !journey) {
    return (
      <div className="mx-auto max-w-2xl">
        <SEO title="Journey not available" description="This Journey isn’t available." path={`/platform/journeys/${slug}`} />
        <EmptyState
          icon={load.state === 'error' ? AlertCircle : Route}
          title={load.state === 'error' ? 'This Journey couldn’t load' : 'This Journey isn’t available'}
          description={load.state === 'error' ? 'Please try again in a moment.' : 'It may have moved or isn’t published.'}
          action={<Button to="/journeys">See all Journeys</Button>}
        />
      </div>
    )
  }

  const stage = journey.stages.find((s) => s.id === stageId) ?? journey.stages[0]
  // The stages either side of this one, for the buttons at the end of it.
  const stageIndex = journey.stages.findIndex((s) => s.id === stage.id)
  const previousStage = stageIndex > 0 ? { ...journey.stages[stageIndex - 1], index: stageIndex - 1 } : null
  const nextStage = stageIndex >= 0 && stageIndex < journey.stages.length - 1 ? { ...journey.stages[stageIndex + 1], index: stageIndex + 1 } : null
  const progress = state.phase === 'ready' ? state.progress : null

  // From the buttons at the end of a stage: the next stage starts at its
  // own beginning, not where the last one left off.
  function goToStage(id: string) {
    setStageId(id)
    // To the step itself (on a phone the list sits above it).
    window.setTimeout(() => document.getElementById('journey-step')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }


  const stageP = stageProgress.get(stage.id)
  const openInStage = progress ? stage.actions.filter((a) => canMark(a) && !progress.done[a.id]).length : 0
  const finishedStages = journey.stages.filter((s) => stageProgress.get(s.id)?.complete).length

  function completeAndContinue() {
    completeStage(stage.id)
    if (nextStage) goToStage(nextStage.id)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SEO title={journey.name} description={journey.shortDescription || journey.goal} path={`/platform/journeys/${slug}`} />

      {/* Top: where we are, and the Journey's progress */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="flex min-w-0 items-center gap-2 text-[14px] text-navy/55">
          <Link to="/journeys" className="inline-flex items-center gap-1.5 hover:text-primary">
            <ArrowLeft size={15} aria-hidden /> Journeys
          </Link>
          <span aria-hidden>/</span>
          <Link to={`/journeys/${journey.slug}`} className="truncate font-semibold text-navy hover:text-primary">
            {journey.name}
          </Link>
        </p>
        {state.phase === 'ready' && summary && (
          <div className="w-full lg:w-80">
            <p className="flex justify-between text-[13px] text-navy/55">
              <span>Journey progress</span>
              <span className="font-semibold text-navy">
                {finishedStages} of {journey.stages.length} steps
              </span>
            </p>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy/[0.07]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.percent}
              aria-label="Journey progress"
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${summary.percent}%` }} />
            </div>
          </div>
        )}
      </div>

      {summary?.complete && (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-6 text-center md:p-8">
          <PartyPopper size={30} className="mx-auto text-emerald-600" aria-hidden />
          <h2 className="mt-3 font-display text-2xl font-bold text-navy">Journey complete</h2>
          <p className="mx-auto mt-2 max-w-xl whitespace-pre-line text-[15px] leading-relaxed text-navy/65">
            {journey.completionMessage || 'You finished every step available in this Journey. Well done!'}
          </p>
        </section>
      )}

      {state.phase === 'not_started' && (
        <section className="flex flex-col gap-4 rounded-[24px] border border-primary/15 bg-blue-50/60 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="font-display text-[20px] font-bold text-navy">{journey.name}</h2>
            {(journey.intro || journey.goal) && (
              <p className="mt-1 whitespace-pre-line text-[14.5px] leading-relaxed text-navy/65">{journey.intro || journey.goal}</p>
            )}
          </div>
          <div className="shrink-0">
            <Button onClick={() => void start()} disabled={starting}>
              {starting ? 'Starting…' : 'Start this Journey'}
            </Button>
            <p className="mt-2 text-[12.5px] text-navy/50">Free. Your progress is saved to your account.</p>
          </div>
        </section>
      )}
      {state.phase === 'error' && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{state.message}</p>}
      {saveError && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{saveError}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <JourneyStepList
            title="Your journey"
            stages={journey.stages}
            activeId={stage.id}
            onSelect={goToStage}
            progress={state.phase === 'ready' ? stageProgress : undefined}
          />
        </div>

        <section id="journey-step" aria-label={stage.title} className="min-w-0 scroll-mt-24 space-y-6">
          <div>
            <p className="w-fit rounded-lg bg-blue-50 px-3 py-1.5 text-[13.5px] font-semibold text-primary">
              Step {stageIndex + 1}
              {stage.level ? ` · ${STAGE_LEVEL_LABEL[stage.level]}` : ''}
            </p>
            <h1 className="mt-4 font-display text-[28px] font-extrabold leading-tight tracking-tight text-navy md:text-[36px]">
              {stage.title || `Stage ${stageIndex + 1}`}
            </h1>
            {stage.summary && <p className="mt-3 max-w-3xl whitespace-pre-line text-[15.5px] leading-relaxed text-navy/65">{stage.summary}</p>}
            {stage.estimatedMinutes > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-navy/55">
                <Clock size={16} aria-hidden /> ~{formatMinutes(stage.estimatedMinutes)}
              </p>
            )}
          </div>

          <ul className="space-y-3">
            {stage.actions.map((action) => (
              <JourneyActionCard
                key={action.id}
                action={action}
                access={actionAccess(action, access)}
                done={Boolean(progress?.done[action.id])}
                markable={state.phase === 'ready' && canMark(action)}
                onToggle={() => toggle(action.id)}
                highlight={state.phase === 'ready' && !summary?.complete && action.id === summary?.resumeActionId}
              />
            ))}
          </ul>

          {state.phase === 'ready' ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              {openInStage > 0 ? (
                <button
                  type="button"
                  onClick={completeAndContinue}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-[15px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95"
                >
                  {nextStage ? 'Mark complete & continue' : 'Mark complete'} <ArrowRight size={17} aria-hidden />
                </button>
              ) : (
                nextStage && (
                  <button
                    type="button"
                    onClick={() => goToStage(nextStage.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-[15px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95"
                  >
                    Next step <ArrowRight size={17} aria-hidden />
                  </button>
                )
              )}
              <p className="inline-flex items-center gap-1.5 text-[13.5px] text-navy/50">
                <Check size={15} className="text-emerald-600" aria-hidden />
                {saving ? 'Saving…' : stageP?.complete ? 'This step is done. Your progress is saved.' : 'Your progress is saved automatically.'}
              </p>
            </div>
          ) : (
            state.phase === 'not_started' && <p className="text-[13.5px] text-navy/50">Start the Journey to check off steps.</p>
          )}

          <JourneyLearnCard outcomes={journey.outcomes} goal={journey.goal} />
          <JourneyNoticeBar text={journey.notice} validatedStates={journey.validatedStates} />

          {journey.stages.length > 1 && (
            <nav aria-label="Stages" className="flex flex-col gap-3 border-t border-navy/[0.06] pt-6 sm:flex-row sm:items-stretch">
              {[previousStage, nextStage].map((target, i) => {
                const isNext = i === 1
                if (!target) return <span key={isNext ? 'next' : 'previous'} className="hidden flex-1 sm:block" aria-hidden />
                return (
                  <button
                    key={isNext ? 'next' : 'previous'}
                    type="button"
                    onClick={() => goToStage(target.id)}
                    className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-navy/10 bg-white px-4 py-3 transition-colors hover:border-primary/30 ${
                      isNext ? 'text-left sm:justify-end sm:text-right' : 'text-left'
                    }`}
                  >
                    {!isNext && <ChevronLeft size={18} className="shrink-0 text-primary" aria-hidden />}
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-semibold uppercase tracking-wide text-navy/40">{isNext ? 'Next' : 'Previous'}</span>
                      <span className="block truncate text-[14px] font-semibold text-navy">{target.title || `Stage ${target.index + 1}`}</span>
                    </span>
                    {isNext && <ChevronRight size={18} className="shrink-0 text-primary" aria-hidden />}
                  </button>
                )
              })}
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}
