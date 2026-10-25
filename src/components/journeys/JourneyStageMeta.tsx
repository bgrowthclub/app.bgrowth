import { Clock } from 'lucide-react'
import { formatMinutes, STAGE_LEVEL_LABEL } from '../../modules/journeys/estimate'
import type { JourneyStage } from '../../modules/journeys/types'

// A stage's level and estimated time, when Studio gave them. Nothing is
// shown for what wasn't set.
export default function JourneyStageMeta({ stage, className = '' }: { stage: JourneyStage; className?: string }) {
  if (!stage.level && !stage.estimatedMinutes) return null
  return (
    <p className={`flex flex-wrap items-center gap-2 text-[12px] font-medium text-navy/45 ${className}`}>
      {stage.level && <span className="rounded-full bg-primary/[0.08] px-2 py-0.5 font-semibold text-primary">{STAGE_LEVEL_LABEL[stage.level]}</span>}
      {stage.estimatedMinutes > 0 && (
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden /> about {formatMinutes(stage.estimatedMinutes)}
        </span>
      )}
    </p>
  )
}
