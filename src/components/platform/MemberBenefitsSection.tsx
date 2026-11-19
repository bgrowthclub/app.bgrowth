import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import DashboardSectionTitle from './DashboardSectionTitle'
import { useMemberPlan } from '../../modules/account/useMemberPlan'

// Member benefits (19/11/2026, the owner's decision): what the member's OWN
// plan gives — the lines written for that plan in Admin → Plans, the same
// ones the Pricing page shows. The old list here promised things that don't
// exist (marketplace discounts, AI credits). On Free, the first plan on offer
// is shown with "See the plans", so nothing is claimed for an account that
// doesn't have it.
const TONES = [
  'bg-blue-50 text-primary',
  'bg-violet-50 text-violet-600',
  'bg-amber-50 text-amber-600',
  'bg-emerald-50 text-emerald-600',
  'bg-rose-50 text-rose-600',
  'bg-indigo-50 text-indigo-600',
]

export default function MemberBenefitsSection() {
  const { plans, current, loading } = useMemberPlan()
  if (loading) return null
  const mine = current && !current.is_free ? current : null
  const offer = mine
    ? null
    : plans.filter((p) => p.status === 'active' && !p.is_free && p.features.length).sort((a, b) => a.rank - b.rank)[0]
  const plan = mine ?? offer
  if (!plan || !plan.features.length) return null

  return (
    <div>
      <DashboardSectionTitle
        title={mine ? 'Your plan benefits' : 'What a plan adds'}
        count={mine ? plan.name : undefined}
        action={
          <Link to="/platform/membership" className="inline-flex items-center gap-1 font-semibold text-primary">
            {mine ? 'Manage plan' : 'See the plans'} <ArrowRight size={14} aria-hidden />
          </Link>
        }
      />
      {!mine && <p className="-mt-2 mb-5 text-[13.5px] text-navy/55">You are on the Free plan. This is what {plan.name} adds:</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plan.features.map((f, i) => (
          <div key={f} className="flex items-start gap-3.5 rounded-2xl border border-navy/[0.07] bg-white p-4 shadow-softer">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONES[i % TONES.length]}`}>
              <Check size={16} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 pt-1.5 text-[14px] font-medium leading-snug text-navy">{f}</span>
            {mine && <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Included</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
