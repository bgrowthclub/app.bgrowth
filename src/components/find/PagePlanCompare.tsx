import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, Minus, Zap } from 'lucide-react'
import type { PageFeatures } from '../../modules/find/pageFeatures'

// What the member's plan gives on their page next to the most an offered
// plan gives (14/11/2026, plan item 9; since 15/11/2026 both columns come from
// Admin → Plans → Page, so the table can never promise what the plans don't
// say). Shown at the top of the editor only when the two differ.

type Cell = boolean | string
const BOOLS: { key: keyof PageFeatures; label: string }[] = [
  { key: 'hide', label: 'Hide sections you don’t need' },
  { key: 'style', label: 'Background tint, dark color and floating button' },
  { key: 'freeColors', label: 'Any background color and your own text color' },
  { key: 'noBrand', label: 'No BGrowth brand on your page' },
  { key: 'color', label: 'Choose any page color' },
  { key: 'cover', label: 'Cover image' },
  { key: 'address', label: 'Choose your own address (bgrowth.app/p/…)' },
  { key: 'sections', label: 'Add and reorder sections' },
  { key: 'gallery', label: 'Photo gallery' },
  { key: 'signup', label: 'E-mail list (collect contacts)' },
  { key: 'stats', label: 'Your page’s numbers (visits and clicks)' },
]

function Value({ v }: { v: Cell }) {
  if (v === true) return <Check size={16} className="mx-auto text-emerald-600" aria-label="Included" />
  if (v === false) return <Minus size={16} className="mx-auto text-navy/25" aria-label="Not included" />
  return <span>{v}</span>
}

export default function PagePlanCompare({ yours, best }: { yours: PageFeatures; best: PageFeatures }) {
  const [open, setOpen] = useState(false)
  const rows: { label: string; yours: Cell; best: Cell }[] = [
    ...BOOLS.filter((b) => yours[b.key] || best[b.key]).map((b) => ({ label: b.label, yours: yours[b.key] as boolean, best: best[b.key] as boolean })),
    { label: 'Featured photos or videos', yours: String(yours.highlights), best: `Up to ${best.highlights}` },
    { label: 'Products', yours: String(yours.products), best: `Up to ${best.products}` },
  ]
  const differs = BOOLS.some((b) => best[b.key] && !yours[b.key]) || best.highlights > yours.highlights || best.products > yours.products
  if (!differs) return null
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Zap size={16} className="shrink-0 fill-amber-400 text-amber-500" aria-hidden />
        <p className="min-w-0 flex-1 text-[13.5px] text-navy/75">
          Items marked with <span className="font-semibold">⚡</span> come with a higher plan.
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
                <th className="w-32 py-2 text-center font-semibold text-navy">Higher plan ⚡</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-amber-100 last:border-0">
                  <td className="py-2 pr-3">{r.label}</td>
                  <td className="py-2 text-center">
                    <Value v={r.yours} />
                  </td>
                  <td className="py-2 text-center font-semibold text-navy">
                    <Value v={r.best} />
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
