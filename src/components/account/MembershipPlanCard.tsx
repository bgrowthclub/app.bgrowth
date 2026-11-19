import { Link } from 'react-router-dom'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { formatCents } from '../../modules/workspace/lib/bundlePrice'
import { planPrice } from '../../modules/account/planService'
import type { BillingInterval, StoredPlan } from '../../modules/commerce/types/membership'

export type PlanCardAction =
  | { kind: 'current' }
  | { kind: 'note'; text: string }
  | { kind: 'link'; label: string; to: string }
  | { kind: 'choose'; label: string; upgrade: boolean; busy: boolean; disabled: boolean; onClick: () => void }

// One plan in Account → Membership and on the Pricing page (19/11/2026, the
// owner's design): a small tag, the name, the description, the price for
// the chosen interval (a yearly price also shows its monthly share and, when
// there is one, the real saving against twelve monthly payments), the plan's
// own lines from Admin → Plans ("Title — detail" shows the detail under it),
// and one button. Everything comes from the plan; nothing is added here.
export default function MembershipPlanCard({
  plan,
  interval,
  current,
  action,
}: {
  plan: StoredPlan
  interval: BillingInterval
  current: boolean
  action: PlanCardAction
}) {
  const chosen = planPrice(plan, interval) ? interval : interval === 'year' ? 'month' : 'year'
  const price = plan.is_free || plan.price_on_request ? null : planPrice(plan, chosen)
  const monthly = planPrice(plan, 'month')
  const saving = chosen === 'year' && price && monthly ? monthly.charged * 12 - price.charged : 0
  const tag = plan.is_free ? 'Free · no card needed' : plan.highlighted ? 'Most popular' : null

  return (
    <div
      className={`relative flex flex-col rounded-[22px] bg-white p-6 sm:p-7 ${
        current ? 'border-2 border-primary/40 shadow-glow' : 'border border-navy/[0.08] shadow-softer'
      }`}
    >
      {current && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">
          <Check size={12} aria-hidden /> Your plan
        </span>
      )}
      {tag && <p className="w-fit rounded-md bg-primary/[0.07] px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-primary">{tag}</p>}
      <h3 className="mt-3 font-display text-[22px] font-bold text-navy">{plan.name}</h3>
      {plan.description && <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">{plan.description}</p>}

      <div className="mt-5 border-y border-navy/[0.07] py-4">
        {plan.is_free ? (
          <p>
            <span className="font-display text-[30px] font-extrabold text-navy">$0</span> <span className="text-[13px] text-navy/45">/ forever</span>
          </p>
        ) : plan.price_on_request ? (
          <p className="font-display text-[26px] font-extrabold text-navy">Let’s talk</p>
        ) : price ? (
          <>
            <p className="flex flex-wrap items-baseline gap-x-2">
              {price.charged !== price.regular && <span className="text-[15px] text-navy/35 line-through">{formatCents(price.regular)}</span>}
              <span className={`font-display text-[30px] font-extrabold ${plan.highlighted ? 'text-primary' : 'text-navy'}`}>{formatCents(price.charged)}</span>
              <span className="text-[13px] text-navy/45">
                / {chosen === 'year' ? `year (${formatCents(Math.round(price.charged / 12))}/month)` : 'month'}
              </span>
            </p>
            {saving > 0 && <p className="mt-1 text-[12.5px] font-semibold text-emerald-600">You save {formatCents(saving)} a year</p>}
          </>
        ) : (
          <p className="font-display text-[26px] font-extrabold text-navy">—</p>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-3">
        {plan.features.map((f) => {
          const at = f.indexOf(' — ')
          const title = at > 0 ? f.slice(0, at) : f
          const detail = at > 0 ? f.slice(at + 3) : ''
          return (
            <li key={f} className="flex gap-2.5">
              <Check size={16} className={`mt-0.5 shrink-0 ${plan.is_free ? 'text-emerald-500' : 'text-primary'}`} aria-hidden />
              <span>
                <span className="block text-[13.5px] font-semibold text-navy">{title}</span>
                {detail && <span className="block text-[12.5px] text-navy/50">{detail}</span>}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-6">
        {action.kind === 'current' ? (
          <p className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-3 text-[14px] font-semibold text-primary">
            <Check size={16} aria-hidden /> Your current plan
          </p>
        ) : action.kind === 'note' ? (
          <p className="rounded-xl bg-bg-soft px-4 py-3 text-center text-[13.5px] font-medium text-navy/55">{action.text}</p>
        ) : action.kind === 'link' ? (
          <Link to={action.to} className="flex items-center justify-center gap-1.5 rounded-xl bg-bg-soft px-4 py-3 text-[14px] font-semibold text-navy hover:bg-navy/[0.06]">
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled || action.busy}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold transition-opacity disabled:opacity-50 ${
              action.upgrade ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-softer hover:opacity-95' : 'bg-bg-soft text-navy hover:bg-navy/[0.06]'
            }`}
          >
            {action.upgrade && <Sparkles size={15} aria-hidden />}
            {action.busy ? 'One moment…' : action.label}
            {action.upgrade && !action.busy && <ArrowRight size={15} aria-hidden />}
          </button>
        )}
      </div>
    </div>
  )
}
