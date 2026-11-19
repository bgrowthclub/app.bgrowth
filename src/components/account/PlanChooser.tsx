import { useState } from 'react'
import MembershipPlanCard from './MembershipPlanCard'
import type { PlanCardAction } from './MembershipPlanCard'
import { planPrice } from '../../modules/account/planService'
import type { BillingInterval, StoredPlan } from '../../modules/commerce/types/membership'

interface Props {
  // The plans to show (offered ones), in order.
  plans: StoredPlan[]
  currentPlanId: string | null
  busyPlanId: string | null
  // What the button of a paid plan says (e.g. "Subscribe" / "Switch to this plan").
  actionLabel: string
  onChoose: (plan: StoredPlan, interval: BillingInterval) => void
  // Free and "price on request" plans: where their button goes.
  freeTo: string
  requestTo: string
  // Member area only (01/11/2026): what the Free card says to someone who
  // already has an account. Without it that card offered "Create Free
  // Account" to a signed-in member, which led nowhere — and there is no
  // "switch to Free" anyway: going back to Free is what cancelling does.
  freeNote?: string
}

// The plan cards with a Monthly | Yearly switch (shown only when some plan
// has a yearly price). Used on the Pricing page and in Account → Membership.
// Since 19/11/2026 the cards are MembershipPlanCard (the owner's design):
// "Upgrade to …" for a higher plan, "Switch to …" for a lower one.
export default function PlanChooser({ plans, currentPlanId, busyPlanId, actionLabel, onChoose, freeTo, requestTo, freeNote }: Props) {
  const hasYearly = plans.some((p) => !p.is_free && !p.price_on_request && p.yearly_cents != null)
  const [interval, setInterval] = useState<BillingInterval>('month')
  const currentRank = plans.find((p) => p.id === currentPlanId)?.rank ?? null
  // The biggest real yearly saving, for the "Yearly" pill (none = no pill).
  const bestSaving = Math.max(
    0,
    ...plans.map((p) => {
      const m = planPrice(p, 'month')
      const y = planPrice(p, 'year')
      return m && y && !p.is_free ? Math.round((1 - y.charged / (m.charged * 12)) * 100) : 0
    }),
  )

  const actionFor = (plan: StoredPlan): PlanCardAction => {
    const current = plan.id === currentPlanId || (currentPlanId === null && plan.is_free)
    if (current) return { kind: 'current' }
    if (plan.is_free) return freeNote ? { kind: 'note', text: freeNote } : { kind: 'link', label: 'Create Free Account', to: freeTo }
    if (plan.price_on_request) return { kind: 'link', label: 'Talk to us', to: requestTo }
    const chosen = planPrice(plan, interval) ? interval : interval === 'year' ? 'month' : 'year'
    const upgrade = currentRank === null || plan.rank > currentRank
    return {
      kind: 'choose',
      label: currentRank === null ? actionLabel : upgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`,
      upgrade,
      busy: busyPlanId === plan.id,
      disabled: busyPlanId !== null || !planPrice(plan, chosen),
      onClick: () => onChoose(plan, chosen),
    }
  }

  return (
    <div>
      {hasYearly && (
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl bg-bg-soft p-1">
            {(
              [
                ['month', 'Monthly'],
                ['year', 'Yearly'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setInterval(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-[13.5px] font-semibold transition-colors ${
                  interval === id ? 'bg-primary text-white shadow-softer' : 'text-navy/55 hover:text-navy'
                }`}
              >
                {label}
                {id === 'year' && bestSaving > 0 && (
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10.5px] font-bold text-white">up to -{bestSaving}%</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`mx-auto grid max-w-6xl gap-6 pt-3 md:grid-cols-2 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {plans.map((plan) => (
          <MembershipPlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            current={plan.id === currentPlanId || (currentPlanId === null && plan.is_free)}
            action={actionFor(plan)}
          />
        ))}
      </div>
    </div>
  )
}
