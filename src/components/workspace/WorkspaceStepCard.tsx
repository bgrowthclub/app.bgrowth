import type { ReactNode } from 'react'
import { Info, Star } from 'lucide-react'
import { CARD } from './styles'

interface Props {
  number: number
  totalSteps: number
  title: string
  description: string
  whyItMatters?: string
  tip?: string
  children: ReactNode
}

// The open step of a Workspace (21/11/2026, the owner's design): "STEP N OF
// M", the title and description, "Why this matters" beside them, the fields,
// and the step's tip at the end — all written in Studio; a box without text
// isn't drawn. Saving and moving on live in WorkspaceSaveBar. A sibling of
// WorkspaceSectionShell (the accordion's open step).
export default function WorkspaceStepCard({ number, totalSteps, title, description, whyItMatters, tip, children }: Props) {
  return (
    <div className={`${CARD} p-5 sm:p-7`}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-workspace-600">
            Step {number} of {totalSteps}
          </p>
          <h2 className="mt-2 font-display text-[24px] font-bold leading-tight text-navy sm:text-[28px]">{title}</h2>
          {description && <p className="mt-2 text-[14px] leading-relaxed text-navy/55">{description}</p>}
        </div>
        {whyItMatters?.trim() && (
          <div className="w-full shrink-0 rounded-2xl border border-workspace-100 bg-workspace-50 p-4 md:w-64">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-workspace-700">
              <Star className="h-3.5 w-3.5 fill-workspace-500 text-workspace-500" aria-hidden />
              Why this matters
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-navy/60">{whyItMatters}</p>
          </div>
        )}
      </div>

      <div className="mt-7">{children}</div>

      {tip?.trim() && (
        <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-bg-soft px-4 py-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-workspace-500" aria-hidden />
          <p className="text-[13px] leading-relaxed text-navy/60">
            <span className="font-semibold text-navy/80">Tip: </span>
            {tip}
          </p>
        </div>
      )}
    </div>
  )
}
