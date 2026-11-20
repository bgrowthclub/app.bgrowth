import { Check, ChevronRight, Flag } from 'lucide-react'
import { ACTION_KIND } from './JourneyStagePreview'
import { formatMinutes } from '../../modules/journeys/estimate'
import type { StageProgress } from '../../modules/journeys/progress'
import type { JourneyStage } from '../../modules/journeys/types'

interface Props {
  stages: JourneyStage[]
  activeId: string
  onSelect: (id: string) => void
  /** The member's progress per stage; absent on the public page. */
  progress?: Map<string, StageProgress>
  title: string
}

// The stages of a Journey as the owner's design draws them (20/11/2026): a
// card with a progress ring (member only — stages finished, counted), then
// one row per stage with its number, an icon from its first action's kind,
// the title and time, and ✓ / current / open on the right. Used by the
// member's Journey and the public one.
export default function JourneyStepList({ stages, activeId, onSelect, progress, title }: Props) {
  const finished = progress ? stages.filter((s) => progress.get(s.id)?.complete).length : 0
  const activeIndex = Math.max(0, stages.findIndex((s) => s.id === activeId))
  const ring = stages.length ? finished / stages.length : 0

  return (
    <nav aria-label="Stages" className="rounded-[24px] border border-navy/[0.07] bg-white p-4 shadow-softer sm:p-5">
      <h2 className="px-1 font-display text-[18px] font-bold text-navy">{title}</h2>
      {progress && (
        <div className="mt-4 flex items-center gap-4 px-1">
          <span className="relative grid h-[72px] w-[72px] shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-navy/[0.07]" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-primary transition-all duration-500"
                strokeDasharray={`${ring * 97.4} 97.4`}
              />
            </svg>
            <span className="text-[13px] font-bold text-navy">
              {finished} of {stages.length}
            </span>
          </span>
          <span>
            <span className="block text-[15px] font-bold text-navy">
              Step {activeIndex + 1} of {stages.length}
            </span>
            <span className="block text-[12.5px] leading-snug text-navy/55">Finish every step to complete your Journey.</span>
          </span>
        </div>
      )}
      <ol className="mt-4 space-y-1.5">
        {stages.map((stage, i) => {
          const p = progress?.get(stage.id)
          const active = stage.id === activeId
          const Icon = stage.actions[0] ? ACTION_KIND[stage.actions[0].kind].icon : Flag
          return (
            <li key={stage.id}>
              <button
                type="button"
                onClick={() => onSelect(stage.id)}
                aria-current={active ? 'step' : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                  active ? 'border-primary/20 bg-blue-50/70' : 'border-transparent hover:bg-bg-soft'
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${
                    active ? 'bg-primary text-white' : 'bg-bg-soft text-navy/55'
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${p?.complete ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-primary'}`}>
                  <Icon size={18} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold leading-snug text-navy">{stage.title || `Stage ${i + 1}`}</span>
                  {(stage.estimatedMinutes > 0 || (p && p.total > 0)) && (
                    <span className="block text-[12px] text-navy/45">
                      {stage.estimatedMinutes > 0 && `~${formatMinutes(stage.estimatedMinutes)}`}
                      {stage.estimatedMinutes > 0 && p && p.total > 0 && ' · '}
                      {p && p.total > 0 && `${p.done}/${p.total} done`}
                    </span>
                  )}
                </span>
                {p?.complete ? (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                    <Check size={15} strokeWidth={3} aria-label="Done" />
                  </span>
                ) : active ? (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-white">
                    <ChevronRight size={16} aria-hidden />
                  </span>
                ) : progress ? (
                  <span className="h-6 w-6 shrink-0 rounded-full border-2 border-navy/15" aria-hidden />
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
