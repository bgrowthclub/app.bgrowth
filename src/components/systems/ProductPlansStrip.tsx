import { Link } from 'react-router-dom'
import { ArrowRight, Check, Circle, Layers } from 'lucide-react'

// "Included in BGrowth Plans" on a product page (16/11/2026, from the
// owner's design): every offered plan as a pill, ticked when it includes the
// product. Presentational — the page works out which plans include it from
// the same tables the database checks (product_plan_access + includesAll).
export default function ProductPlansStrip({ plans }: { plans: { name: string; included: boolean }[] }) {
  // Shown even when no plan includes the product yet (17/11/2026, the
  // owner's choice): every pill is then an empty circle, which is the truth.
  if (!plans.length) return null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl3 border border-navy/[0.06] bg-white px-5 py-4 shadow-softer">
      <span className="flex items-center gap-2 font-display text-[15px] font-bold text-navy">
        <Layers size={18} className="text-primary" aria-hidden /> Included in BGrowth Plans
      </span>
      <span className="hidden h-6 w-px bg-navy/10 sm:block" aria-hidden />
      <div className="flex flex-wrap gap-2">
        {plans.map((p) => (
          <span
            key={p.name}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
              p.included ? 'bg-primary/[0.08] text-navy' : 'bg-bg-soft text-navy/45'
            }`}
          >
            {p.included ? (
              <Check size={14} className="rounded-full bg-primary p-0.5 text-white" aria-label="Included" />
            ) : (
              <Circle size={14} className="text-navy/30" aria-label="Not included" />
            )}
            {p.name}
          </span>
        ))}
      </div>
      <Link to="/platform/membership" className="ml-auto inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary hover:underline">
        View plans <ArrowRight size={14} />
      </Link>
    </div>
  )
}
