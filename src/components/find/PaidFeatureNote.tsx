import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

// A feature the member's page plan doesn't include, shown instead of hidden
// (14/11/2026, the owner's decision, plan item 7): a ⚡, what it is, and a
// link to the plans — so a "part of the page" plan sees what the whole page
// adds, where it would use it.
export default function PaidFeatureNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-amber-50/70 px-3 py-2 text-[12.5px] text-navy/65">
      <Zap size={14} className="shrink-0 fill-amber-400 text-amber-500" aria-hidden />
      <span>{children}</span>
      <Link to="/platform/membership" className="font-semibold text-primary hover:underline">
        See the plans
      </Link>
    </p>
  )
}
