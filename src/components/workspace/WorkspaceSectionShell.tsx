import type { ReactNode } from 'react'
import { Star, Info, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, WORKSPACE_BUTTON } from './styles'

interface Props {
  number: number
  totalSteps: number
  icon: ReactNode
  title: string
  description: string
  whyItMatters?: string
  tip?: string
  children: ReactNode
  isLast: boolean
  onContinue: () => void
  isSaving: boolean
  saveError: string | null
}

// The open (active) step of a Workspace — heading, "why this matters",
// the fields, a tip, and Save & Continue.
export default function WorkspaceSectionShell({
  number,
  totalSteps,
  icon,
  title,
  description,
  whyItMatters,
  tip,
  children,
  isLast,
  onContinue,
  isSaving,
  saveError,
}: Props) {
  return (
    <div className={`${CARD} p-5 sm:p-7`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-workspace-50 text-workspace-600 [&>svg]:h-6 [&>svg]:w-6">
            {icon}
          </span>
          <div>
            <span className="inline-block rounded-full bg-workspace-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Step {number} of {totalSteps}
            </span>
            <h2 className="mt-2 font-display text-xl font-bold text-navy sm:text-[22px]">{title}</h2>
            <p className="mt-1 text-sm text-navy/45">{description}</p>
          </div>
        </div>

        {whyItMatters && (
          <div className="w-full shrink-0 rounded-xl border border-workspace-100 bg-workspace-50 p-4 sm:w-72">
            <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-workspace-700">
              <Star className="h-3.5 w-3.5 fill-workspace-500 text-workspace-500" />
              Why this matters
            </p>
            <p className="text-xs leading-relaxed text-navy/55">{whyItMatters}</p>
          </div>
        )}
      </div>

      <div className="mt-6">{children}</div>

      {tip && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-bg-soft px-4 py-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-workspace-500" />
          <p className="text-[13px] text-navy/55">
            <span className="font-semibold text-navy/75">Tip: </span>
            {tip}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col items-end gap-2">
        {saveError && (
          <p role="alert" className="text-sm font-medium text-red-500">
            {saveError}
          </p>
        )}
        <Button
          type="button"
          onClick={onContinue}
          disabled={isSaving}
          icon={<ArrowRight className="h-4 w-4" />}
          className={WORKSPACE_BUTTON}
        >
          {isSaving ? 'Saving…' : isLast ? 'Finish Workspace' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
