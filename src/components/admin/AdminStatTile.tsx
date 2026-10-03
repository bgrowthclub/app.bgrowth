import { ArrowDown, ArrowUp } from 'lucide-react'
import { CARD } from './styles'

interface Props {
  label: string
  value: string
  hint?: string
  // Percent change vs the previous period; null hides the badge (no base to
  // compare with — e.g. $0 before — where a percentage would mislead).
  change?: number | null
  // For refunds, going up is bad.
  upIsGood?: boolean
}

// One headline number in the Admin area, with an optional change badge.
export default function AdminStatTile({ label, value, hint, change = null, upIsGood = true }: Props) {
  const showChange = change !== null && Number.isFinite(change)
  const up = (change ?? 0) >= 0
  const good = up === upIsGood
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium text-navy/45">{label}</p>
        {showChange && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
            title="Compared with the previous period"
          >
            {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {Math.abs(Math.round(change ?? 0))}%
          </span>
        )}
      </div>
      <p className="mt-1.5 font-display text-2xl font-bold text-navy">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-navy/40">{hint}</p>}
    </div>
  )
}
