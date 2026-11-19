import type { ReactNode } from 'react'

interface Props {
  title: string
  /** A small pill after the title (e.g. "3 products"). */
  count?: string
  /** Right side: a link or a quiet line. */
  action?: ReactNode
}

// The Dashboard's section title (19/11/2026, the owner's design): a short
// blue bar, the title, an optional count pill, and something on the right.
export default function DashboardSectionTitle({ title, count, action }: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-display text-[18px] font-bold text-navy">
        <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
        {title}
        {count && <span className="rounded-full bg-navy/[0.06] px-2.5 py-0.5 text-[12px] font-semibold text-navy/60">{count}</span>}
      </h2>
      {action && <div className="text-[13px]">{action}</div>}
    </div>
  )
}
