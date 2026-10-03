import { useState } from 'react'

export interface MonthPoint {
  key: string // YYYY-MM
  label: string // "Oct"
  fullLabel: string // "October 2026"
  amount: number // cents, net of refunds
  orders: number
}

interface Props {
  months: MonthPoint[]
  formatMoney: (cents: number) => string
}

const W = 720
const H = 220
const PAD = { top: 12, right: 8, bottom: 28, left: 52 }

function niceMax(value: number) {
  if (value <= 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= value) ?? 10
  return step * magnitude
}

// Net revenue per month — one series, so no legend: the section title names
// it. Hand-rolled SVG (no chart library in this app): thin bars rounded at
// the top, recessive grid, a tooltip per bar on hover or focus.
export default function MonthlyRevenueChart({ months, formatMoney }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(...months.map((m) => m.amount), 0))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const slot = plotW / months.length
  const barW = Math.min(36, slot * 0.6)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH

  const hovered = active === null ? null : months[active]

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Net revenue per month">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-navy/[0.07]" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-navy/40 text-[11px]">
              {formatMoney(t)}
            </text>
          </g>
        ))}
        {months.map((m, i) => {
          const cx = PAD.left + slot * i + slot / 2
          const top = y(m.amount)
          const h = PAD.top + plotH - top
          const r = Math.min(4, h)
          const x0 = cx - barW / 2
          const x1 = cx + barW / 2
          const base = PAD.top + plotH
          return (
            <g
              key={m.key}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${m.fullLabel}: ${formatMoney(m.amount)}, ${m.orders} orders`}
              className="outline-none"
            >
              {/* Hit target wider and taller than the bar. */}
              <rect x={cx - slot / 2} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x1 - r} Q${x1},${top} ${x1},${top + r} V${base} Z`}
                  className={active === i ? 'fill-primary' : 'fill-primary/75'}
                />
              )}
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-navy/45 text-[11px]">
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>

      {hovered && active !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-navy/[0.08] bg-white px-3 py-2 text-[12px] shadow-soft"
          style={{ left: `${((PAD.left + slot * active + slot / 2) / W) * 100}%` }}
        >
          <p className="font-semibold text-navy">{hovered.fullLabel}</p>
          <p className="text-navy/60">
            {formatMoney(hovered.amount)} · {hovered.orders} {hovered.orders === 1 ? 'order' : 'orders'}
          </p>
        </div>
      )}
    </div>
  )
}
