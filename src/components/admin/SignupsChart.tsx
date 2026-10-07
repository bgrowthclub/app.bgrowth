import { useState } from 'react'

export interface SignupPoint {
  key: string
  label: string // axis label ("Oct 3", "Oct")
  fullLabel: string // tooltip title ("Week of Oct 3, 2026")
  signedUp: number
  confirmed: number
}

const W = 720
const H = 220
const PAD = { top: 12, right: 8, bottom: 28, left: 36 }

function niceStep(value: number) {
  const raw = Math.max(value / 4, 1)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const m = [1, 2, 5, 10].find((f) => f * magnitude >= raw) ?? 10
  return Math.max(1, m * magnitude)
}

// Sign-ups per day/week/month, with the confirmed part of each bar darker
// (same hand-rolled SVG style as MonthlyRevenueChart). Tooltip on hover or
// focus; only every few axis labels when there are many bars.
export default function SignupsChart({ points }: { points: SignupPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  const top = Math.max(...points.map((p) => p.signedUp), 0)
  const step = niceStep(top)
  const max = Math.max(step, Math.ceil(top / step) * step)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const slot = plotW / Math.max(points.length, 1)
  const barW = Math.max(3, Math.min(32, slot * 0.6))
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step)
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const base = PAD.top + plotH
  const labelEvery = Math.ceil(points.length / 12)
  const hovered = active === null ? null : points[active]

  const bar = (x0: number, x1: number, top: number, bottom: number, round: boolean) => {
    const r = round ? Math.min(3, bottom - top, (x1 - x0) / 2) : 0
    return `M${x0},${bottom} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x1 - r} Q${x1},${top} ${x1},${top + r} V${bottom} Z`
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Sign-ups over time">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-navy/[0.07]" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-navy/40 text-[11px]">
              {t}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const cx = PAD.left + slot * i + slot / 2
          const x0 = cx - barW / 2
          const x1 = cx + barW / 2
          const topAll = y(p.signedUp)
          const topConfirmed = y(p.confirmed)
          return (
            <g
              key={p.key}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${p.fullLabel}: ${p.signedUp} signed up, ${p.confirmed} confirmed`}
              className="outline-none"
            >
              <rect x={cx - slot / 2} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {p.signedUp > 0 && (
                <path d={bar(x0, x1, topAll, base, true)} className={active === i ? 'fill-primary/45' : 'fill-primary/25'} />
              )}
              {p.confirmed > 0 && (
                <path
                  d={bar(x0, x1, topConfirmed, base, p.confirmed === p.signedUp)}
                  className={active === i ? 'fill-primary' : 'fill-primary/80'}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle" className="fill-navy/45 text-[11px]">
                  {p.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {hovered && active !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-navy/[0.08] bg-white px-3 py-2 text-[12px] shadow-soft"
          style={{ left: `${Math.min(86, Math.max(14, ((PAD.left + slot * active + slot / 2) / W) * 100))}%` }}
        >
          <p className="font-semibold text-navy">{hovered.fullLabel}</p>
          <p className="text-navy/60">
            {hovered.signedUp} signed up · {hovered.confirmed} confirmed
          </p>
        </div>
      )}
    </div>
  )
}
