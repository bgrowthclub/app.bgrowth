import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Flag, PartyPopper, Route } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import JourneyNotice from '../../components/journeys/JourneyNotice'
import JourneyActionCard from '../../components/journeys/JourneyActionCard'
import JourneyStageMeta from '../../components/journeys/JourneyStageMeta'
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
  const { state, summary, start, starting, toggle, saving, saveError } = useJourneyProgress(journey, user?.id)

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
  const progress = state.phase === 'ready' ? state.progress : null
  const resumeAction = summary?.resumeActionId ? journey.stages.flatMap((s) => s.actions).find((a) => a.id === summary.resumeActionId) : undefined

  function goToResume() {
    if (!summary?.resumeStageId || !summary.resumeActionId) return
    setStageId(summary.resumeStageId)
    window.setTimeout(() => document.getElementById(`action-${summary.resumeActionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SEO title={journey.name} description={journey.shortDescription || journey.goal} path={`/platform/journeys/${slug}`} />

      <Link to={`/journeys/${journey.slug}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-navy/50 hover:text-primary">
        <ArrowLeft size={15} /> Journey overview
      </Link>

      <header className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer md:p-7">
        <p className="eyebrow">Journey</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">{journey.name}</h1>
        {journey.goal && (
          <p className="mt-3 flex items-start gap-2 text-[15px] text-navy/70">
            <Flag size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden /> {journey.goal}
          </p>
        )}

        {state.phase === 'ready' && summary && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-[13px] font-semibold text-navy/60">
              <span>
                {summary.done} of {summary.total} steps done
              </span>
              <span className="text-primary">{summary.percent}%</span>
            </div>
            <div
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-navy/[0.06]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.percent}
              aria-label="Journey progress"
            >
              <div className="h-full rounded-full bg-grad-primary transition-[width] duration-500" style={{ width: `${summary.percent}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-navy/40">
              {saving ? 'Saving…' : 'Saved to your account.'} Steps that are coming soon or not available don’t count.
            </p>
            {!summary.complete && resumeAction && (
              <button
                type="button"
                onClick={goToResume}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/[0.07] px-4 py-2.5 text-left text-[13.5px] font-semibold text-primary hover:bg-primary/[0.12]"
              >
                Continue: {resumeAction.title} <ArrowRight size={15} aria-hidden />
              </button>
            )}
          </div>
        )}

        {state.phase === 'not_started' && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={() => void start()} disabled={starting}>
              {starting ? 'Starting…' : 'Start this Journey'}
            </Button>
            <p className="text-[13px] text-navy/50">Free. Your progress is saved to your account.</p>
          </div>
        )}
        {state.phase === 'loading' && <div className="mt-6 h-11 w-48 animate-pulse rounded-xl bg-bg-soft" />}
        {state.phase === 'error' && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{state.message}</p>}
        {saveError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{saveError}</p>}
      </header>

      {summary?.complete && (
        <section className="rounded-xl3 border border-emerald-200 bg-emerald-50/70 p-6 text-center md:p-8">
          <PartyPopper size={30} className="mx-auto text-emerald-600" aria-hidden />
          <h2 className="mt-3 font-display text-2xl font-bold text-navy">Journey complete</h2>
          <p className="mx-auto mt-2 max-w-xl whitespace-pre-line text-[15px] leading-relaxed text-navy/65">
            {journey.completionMessage || 'You finished every step available in this Journey. Well done!'}
          </p>
        </section>
      )}

      <JourneyNotice text={journey.notice} validatedStates={journey.validatedStates} />

      {journey.intro && state.phase === 'not_started' && <p className="whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{journey.intro}</p>}

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Stages" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {journey.stages.map((s, i) => {
              const p = stageProgress.get(s.id)
              const active = s.id === stage.id
              return (
                <li key={s.id} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => setStageId(s.id)}
                    aria-current={active ? 'step' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl2 border px-3.5 py-2.5 text-left transition-colors ${
                      active ? 'border-primary/30 bg-white shadow-softer' : 'border-transparent bg-white/60 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${
                        p?.complete ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {p?.complete ? <Check size={14} strokeWidth={3} aria-hidden /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap text-[13.5px] font-semibold text-navy lg:whitespace-normal">{s.title || `Stage ${i + 1}`}</span>
                      {p && p.total > 0 && (
                        <span className="block text-[11.5px] text-navy/45">
                          {p.done}/{p.total} done
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <section aria-label={stage.title} className="min-w-0">
          <h2 className="font-display text-xl font-bold text-navy">{stage.title}</h2>
          <JourneyStageMeta stage={stage} className="mt-1.5" />
          {stage.summary && <p className="mt-1 whitespace-pre-line text-[14.5px] leading-relaxed text-navy/60">{stage.summary}</p>}
          <ul className="mt-5 space-y-3">
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
          {state.phase === 'not_started' && <p className="mt-4 text-[13px] text-navy/45">Start the Journey to check off steps.</p>}
        </section>
      </div>
    </div>
  )
}
