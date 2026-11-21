import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ACTION_KIND } from './JourneyStagePreview'
import { formatMinutes, STAGE_LEVEL_LABEL } from '../../modules/journeys/estimate'
import type { JourneyStage } from '../../modules/journeys/types'

const SHOWN = 4

// Every stage of a Journey at once (21/11/2026, the owner's design for the
// public page): a numbered line down the left, and per stage its title, how
// many actions and how long (only when Studio gives times), its summary and
// its actions — up to four, then "Show all". Read only: the resources open
// once the Journey is started.
export default function JourneyTimeline({ stages }: { stages: JourneyStage[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})

  return (
    <ol className="relative space-y-5">
      {stages.map((stage, i) => {
        const all = open[stage.id]
        const actions = all ? stage.actions : stage.actions.slice(0, SHOWN)
        const last = i === stages.length - 1
        return (
          <li key={stage.id} className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-3 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-5">
            <div className="relative flex justify-center">
              {!last && <span className="absolute bottom-[-20px] top-11 w-0.5 bg-primary/25 sm:top-14" aria-hidden />}
              <span className="relative z-[1] grid h-11 w-11 place-items-center rounded-full bg-primary text-[14px] font-bold text-white shadow-softer sm:h-14 sm:w-14 sm:text-[17px]">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="grid min-w-0 gap-5 rounded-[22px] border border-navy/[0.07] bg-white p-5 shadow-softer sm:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="min-w-0">
                <h3 className="font-display text-[19px] font-bold leading-snug text-navy sm:text-[21px]">{stage.title || `Step ${i + 1}`}</h3>
                <p className="mt-2 flex flex-wrap gap-1.5 text-[12px] font-semibold">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-primary">
                    {stage.actions.length} {stage.actions.length === 1 ? 'action' : 'actions'}
                  </span>
                  {stage.estimatedMinutes > 0 && <span className="rounded-md bg-bg-soft px-2 py-0.5 text-navy/60">~{formatMinutes(stage.estimatedMinutes)}</span>}
                  {stage.level && <span className="rounded-md bg-bg-soft px-2 py-0.5 text-navy/60">{STAGE_LEVEL_LABEL[stage.level]}</span>}
                </p>
                {stage.summary && <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-navy/60">{stage.summary}</p>}
              </div>
              {stage.actions.length > 0 && (
                <div className="min-w-0">
                  <ul className="divide-y divide-navy/[0.06] overflow-hidden rounded-2xl border border-navy/[0.07]">
                    {actions.map((action) => {
                      const kind = ACTION_KIND[action.kind]
                      const Icon = kind.icon
                      return (
                        <li key={action.id} className="flex items-center gap-3 px-4 py-2.5">
                          <Icon size={17} className="shrink-0 text-primary" aria-label={kind.label} />
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-navy">{action.title}</span>
                          {action.state === 'coming_soon' ? (
                            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Coming soon</span>
                          ) : action.state === 'unavailable' ? (
                            <span className="shrink-0 rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-semibold text-navy/45">Unavailable</span>
                          ) : (
                            <span className="shrink-0 text-[12px] text-navy/45">
                              {kind.label}
                              {action.estimatedMinutes != null ? ` · ${formatMinutes(action.estimatedMinutes)}` : ''}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  {stage.actions.length > SHOWN && (
                    <button
                      type="button"
                      onClick={() => setOpen((o) => ({ ...o, [stage.id]: !all }))}
                      aria-expanded={Boolean(all)}
                      className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
                    >
                      {all ? 'Show less' : `Show all (${stage.actions.length})`}
                      <ChevronDown size={14} className={all ? 'rotate-180' : ''} aria-hidden />
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
