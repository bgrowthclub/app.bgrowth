import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, Minus, Zap } from 'lucide-react'

// What a "part of the page" plan has next to the whole page (14/11/2026, the
// owner's decision, plan item 9), shown at the top of the editor for that
// plan. Every line is what the editor and api/account.ts actually allow —
// change it when those limits change (maxHighlights / maxProducts in
// MemberPageBuilder, cleanPage in api/account.ts).

type Cell = boolean | string
const ROWS: { label: string; yours: Cell; whole: Cell }[] = [
  { label: 'Your texts, buttons, services and photos', yours: true, whole: true },
  { label: 'Background tint, dark color and floating button', yours: true, whole: true },
  { label: 'Hide sections you don’t need', yours: true, whole: true },
  { label: 'No BGrowth brand on your page', yours: true, whole: true },
  { label: 'Page color', yours: 'The model’s', whole: 'Any color' },
  { label: 'Cover image', yours: false, whole: true },
  { label: 'Your own address (bgrowth.app/p/…)', yours: 'Made from your name', whole: 'You choose' },
  { label: 'Featured photos or videos', yours: '1', whole: 'Up to 8' },
  { label: 'Products', yours: 'Up to 12', whole: 'Up to 60' },
  { label: 'Photo gallery', yours: false, whole: true },
  { label: 'Add and reorder sections', yours: false, whole: true },
  { label: 'E-mail list (collect contacts)', yours: false, whole: true },
]

function Value({ v }: { v: Cell }) {
  if (v === true) return <Check size={16} className="mx-auto text-emerald-600" aria-label="Included" />
  if (v === false) return <Minus size={16} className="mx-auto text-navy/25" aria-label="Not included" />
  return <span>{v}</span>
}

export default function PagePlanCompare() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Zap size={16} className="shrink-0 fill-amber-400 text-amber-500" aria-hidden />
        <p className="min-w-0 flex-1 text-[13.5px] text-navy/75">
          Items marked with <span className="font-semibold">⚡</span> come with the whole page plan.
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
          {open ? 'Hide comparison' : 'Compare plans'} {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-[13px] text-navy/75">
            <thead>
              <tr className="border-b border-amber-200 text-[12px] font-semibold uppercase tracking-wide text-navy/50">
                <th className="py-2 pr-3 font-semibold">What you get</th>
                <th className="w-32 py-2 text-center font-semibold">Your plan</th>
                <th className="w-32 py-2 text-center font-semibold text-navy">Whole page ⚡</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-b border-amber-100 last:border-0">
                  <td className="py-2 pr-3">{r.label}</td>
                  <td className="py-2 text-center">
                    <Value v={r.yours} />
                  </td>
                  <td className="py-2 text-center font-semibold text-navy">
                    <Value v={r.whole} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/platform/membership" className="btn-primary mt-4 inline-flex !py-2 text-[13.5px]">
            See the plans
          </Link>
        </div>
      )}
    </div>
  )
}
