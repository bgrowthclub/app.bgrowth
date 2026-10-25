import { formatMinutes } from '../../modules/journeys/estimate'
import { BookOpen, CheckSquare, ExternalLink, Package, PlayCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import JourneyStageMeta from './JourneyStageMeta'
import type { JourneyAction, JourneyActionKind, JourneyStage } from '../../modules/journeys/types'

export const ACTION_KIND: Record<JourneyActionKind, { label: string; icon: LucideIcon }> = {
  manual: { label: 'Task', icon: CheckSquare },
  product: { label: 'Tool', icon: Package },
  article: { label: 'Article', icon: BookOpen },
  video: { label: 'Video', icon: PlayCircle },
  link: { label: 'Link', icon: ExternalLink },
}

function StateTag({ action }: { action: JourneyAction }) {
  if (action.state === 'coming_soon') return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Coming soon</span>
  if (action.state === 'unavailable') return <span className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-semibold text-navy/45">Unavailable</span>
  return null
}

// The public preview of a Journey's stages (/journeys/:slug): every stage in
// order with what it's about and the titles of its actions. Opening the
// resources, instructions and progress belong to the member's page.
export default function JourneyStagePreview({ stages }: { stages: JourneyStage[] }) {
  return (
    <ol className="space-y-4">
      {stages.map((stage, i) => (
        <li key={stage.id} className="rounded-xl2 border border-navy/[0.06] bg-white p-5 shadow-softer md:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-[15px] font-bold text-primary">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[17px] font-semibold text-navy">{stage.title || `Stage ${i + 1}`}</h3>
              <JourneyStageMeta stage={stage} className="mt-1.5" />
              {stage.summary && <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-navy/55">{stage.summary}</p>}
              <ul className="mt-4 space-y-2">
                {stage.actions.map((action) => {
                  const kind = ACTION_KIND[action.kind]
                  const Icon = kind.icon
                  return (
                    <li key={action.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14px] text-navy/75">
                      <Icon size={16} className="shrink-0 text-primary/70" aria-label={kind.label} />
                      <span className="min-w-0">{action.title}</span>
                      {action.estimatedMinutes != null && <span className="text-[11.5px] font-medium text-navy/35">{formatMinutes(action.estimatedMinutes)}</span>}
                      {action.optional && <span className="text-[11.5px] font-medium text-navy/35">Optional</span>}
                      {action.states.length > 0 && <span className="text-[11.5px] font-medium text-navy/40">{action.states.join(', ')} only</span>}
                      <StateTag action={action} />
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
