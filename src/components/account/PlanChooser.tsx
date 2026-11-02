import { useState } from 'react'
import PricingTierCard from '../ui/PricingTierCard'
import Badge from '../ui/Badge'
import { formatCents } from '../../modules/workspace/lib/bundlePrice'
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
export default function PlanChooser({ plans, currentPlanId, busyPlanId, actionLabel, onChoose, freeTo, requestTo, freeNote }: Props) {
  const hasYearly = plans.some((p) => !p.is_free && !p.price_on_request && p.yearly_cents != null)
  const [interval, setInterval] = useState<BillingInterval>('month')

  return (
    <div>
      {hasYearly && (
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full bg-bg-soft p-1">
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
                className={`rounded-full px-5 py-1.5 text-[13px] font-semibold transition-colors ${
                  interval === id ? 'bg-white text-navy shadow-softer' : 'text-navy/55 hover:text-navy'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`mx-auto grid max-w-6xl gap-6 md:grid-cols-2 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {plans.map((plan) => {
          const current = plan.id === currentPlanId || (currentPlanId === null && plan.is_free)
          const badge = current ? <Badge variant="outline">Your plan</Badge> : plan.highlighted ? <Badge>Most popular</Badge> : undefined
          if (plan.is_free) {
            return (
              <PricingTierCard
                key={plan.id}
                name={plan.name}
                price="$0"
                priceNote="forever"
                description={plan.description}
                features={plan.features}
                ctaLabel={current ? 'Your plan' : freeNote ?? 'Create Free Account'}
                {...(current || !freeNote ? { ctaTo: freeTo } : { onCtaClick: () => {}, ctaDisabled: true })}
                highlighted={plan.highlighted}
                badge={badge}
              />
            )
          }
          if (plan.price_on_request) {
            return (
              <PricingTierCard
                key={plan.id}
                name={plan.name}
                price="Let’s talk"
                description={plan.description}
                features={plan.features}
                ctaLabel={current ? 'Your plan' : 'Talk to us'}
                ctaTo={requestTo}
                highlighted={plan.highlighted}
                badge={badge}
              />
            )
          }
          // A plan with no price for the chosen interval falls back to the other one.
          const chosen = planPrice(plan, interval) ? interval : interval === 'year' ? 'month' : 'year'
          const price = planPrice(plan, chosen)
          return (
            <PricingTierCard
              key={plan.id}
              name={plan.name}
              price={price ? formatCents(price.charged) : '—'}
              regularPrice={price && price.charged !== price.regular ? formatCents(price.regular) : undefined}
              priceNote={chosen === 'year' ? '/ year' : '/ month'}
              description={plan.description}
              features={plan.features}
              ctaLabel={current ? 'Your plan' : busyPlanId === plan.id ? 'One moment…' : actionLabel}
              onCtaClick={() => onChoose(plan, chosen)}
              ctaDisabled={current || busyPlanId !== null || !price}
              highlighted={plan.highlighted}
              badge={badge}
            />
          )
        })}
      </div>
    </div>
  )
}
