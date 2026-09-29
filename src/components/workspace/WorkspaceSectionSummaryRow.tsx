import type { ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { CARD } from './styles'

export type WorkspaceStatusKind = 'completed' | 'progress' | 'optional'

const STATUS_STYLES: Record<WorkspaceStatusKind, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  progress: 'bg-workspace-50 text-workspace-700',
  optional: 'bg-navy/[0.04] text-navy/55',
}

interface Props {
  number: number
  icon: ReactNode
  title: string
  description: string
  statusLabel: string
  statusKind: WorkspaceStatusKind
  isCompleted: boolean
  onClick: () => void
}

// A collapsed step — click to open it.
export default function WorkspaceSectionSummaryRow({
  number,
  icon,
  title,
  description,
  statusLabel,
  statusKind,
  isCompleted,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${CARD} flex w-full items-center gap-3 p-4 text-left transition-shadow duration-150 hover:shadow-soft sm:gap-4 sm:p-5`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isCompleted ? 'bg-emerald-500 text-white' : 'bg-navy/10 text-navy/55'
        }`}
      >
        {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
      </span>

      {/* The icon tile only from sm up — on a phone the width goes to the name. */}
      <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-workspace-50 text-workspace-600 sm:flex [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        {/* Full name, wrapping to a second line when needed (the number is
            already in the circle, so it isn't repeated here). */}
        <span className="block break-words text-[15px] font-semibold leading-snug text-navy line-clamp-2">
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-navy/45 line-clamp-2">{description}</span>
      </span>

      <span
        className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${STATUS_STYLES[statusKind]}`}
      >
        {statusLabel}
      </span>

      <ChevronDown className="h-[18px] w-[18px] shrink-0 text-navy/30" />
    </button>
  )
}
