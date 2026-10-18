import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import SectionHeader from '../components/ui/SectionHeader'
import PricingTierCard from '../components/ui/PricingTierCard'
import FAQ from '../components/ui/FAQ'
import PlanChooser from '../components/account/PlanChooser'
import { MEMBERSHIP_PLANS, formatPlanPrice } from '../data/membershipPlans'
import { useIdentity } from '../modules/identity/IdentityContext'
import { useMemberPlan } from '../modules/account/useMemberPlan'
import { planService } from '../modules/account/planService'
import type { BillingInterval, StoredPlan } from '../modules/commerce/types/membership'

// What BGrowth really sells today (09/10/2026): a free account, Workspaces
// bought once, and bundles of them. The monthly plans in
// data/membershipPlans.ts stay there as 'coming-soon' and come back to this
// page when Plans & Subscriptions exist — only a published plan is shown.
const FREE_PLAN = MEMBERSHIP_PLANS.find((plan) => plan.tier === 'free' && plan.status === 'published')

const OPTIONS = [
  ...(FREE_PLAN
    ? [
        {
          name: FREE_PLAN.name,
          price: formatPlanPrice(FREE_PLAN) ?? '$0',
          priceNote: 'forever',
          description: FREE_PLAN.description,
          features: FREE_PLAN.features,
          ctaLabel: 'Create Free Account',
          ctaTo: '/register',
        },
      ]
    : []),
  {
    name: 'One Workspace',
    price: 'Pay once',
    priceNote: 'per Workspace',
    description: 'Buy exactly the Workspace™ you need.',
    features: [
      'Lifetime access — no subscription',
      'Save as many records as you need',
      'Print or download as PDF',
      'Help from our Support team',
    ],
    ctaLabel: 'Browse Workspaces',
    ctaTo: '/systems',
    highlighted: true,
  },
  {
    name: 'Bundles',
    price: 'Save more',
    priceNote: 'one-time',
    description: 'Several Workspaces together, for less.',
    features: [
      'One price for the whole set',
      'Already own some? Pay only for the rest',
      'Each Workspace is yours to keep',
      'Lifetime access — no subscription',
    ],
    ctaLabel: 'See Bundles',
    ctaTo: '/systems',
  },
]

const PRICING_FAQ = [
  {
    question: 'Is there a subscription?',
    answer: 'No. Today every Workspace and bundle is a one-time payment with lifetime access. Monthly plans are coming — newsletter subscribers hear first.',
  },
  {
    question: 'What can I do with a free account?',
    answer: 'Use the free Workspaces, try one paid Workspace free for a few days (where a trial is offered), and get our newsletter — no card required.',
  },
  {
    question: 'I already own some Workspaces in a bundle. Do I pay for them again?',
    answer: 'No. The bundle page shows a lower price that covers only the Workspaces you don’t own yet.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Products are digital and available right away, so all sales are final. If something isn’t working, open a ticket in Support and we’ll look into it. See our Refund Policy.',
  },
]

// The FAQ once plans are sold.
const PLAN_FAQ = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Cancel in Account → Membership. Your plan stays until the end of the period you already paid, and it isn’t charged again.',
  },
  {
    question: 'Can I change my plan later?',
    answer: 'Yes, in Account → Membership. The price difference is adjusted on your next bill.',
  },
  {
    question: 'Do I keep the Workspaces I bought if I cancel?',
    answer: 'Yes. Workspaces and bundles bought one-time are yours to keep, with or without a plan.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Products are digital and available right away, so all sales are final. If something isn’t working, open a ticket in Support and we’ll look into it. See our Refund Policy.',
  },
]

export default function PricingPage() {
  const { user } = useIdentity()
  const navigate = useNavigate()
  const { plans, current, subscription } = useMemberPlan()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Plans are sold once at least one paid plan is "Offered" in Admin → Plans
  // (Sprint 122); until then the page stays as before.
  const offered = plans.filter((p) => p.status === 'active')
  const selling = offered.some((p) => !p.is_free)
  const oneTime = OPTIONS.filter((o) => o.name !== FREE_PLAN?.name)

  async function choose(plan: StoredPlan, interval: BillingInterval) {
    if (!user) {
      navigate(`/register?next=${encodeURIComponent('/pricing')}`)
      return
    }
    // Already paying: changing plan is done in Account → Membership.
    if (subscription) {
      navigate('/platform/membership')
      return
    }
    setBusy(plan.id)
    setError(null)
    try {
      window.location.href = await planService.checkout(plan.id, interval)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t start the checkout.')
      setBusy(null)
    }
  }

  if (selling) {
    return (
      <div className="pb-24 pt-32 md:pt-40">
        <SEO
          title="Pricing"
          description="BGrowth plans — start free, subscribe for more, or buy a Workspace once and keep it."
          keywords={['bgrowth pricing', 'bgrowth plans', 'workspace pricing']}
          path="/pricing"
        />
        <section className="container-px mx-auto max-w-page text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mx-auto mt-2 max-w-xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Choose the plan that fits you.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-navy/55">
            Start free. Subscribe when you want more — cancel anytime.
          </p>
        </section>

        <section className="section-py">
          <div className="container-px mx-auto max-w-page">
            {error && <p className="mx-auto mb-6 max-w-xl rounded-xl bg-red-50 px-4 py-3 text-center text-[13.5px] text-red-600">{error}</p>}
            <PlanChooser
              plans={offered}
              currentPlanId={user ? current?.id ?? null : 'none'}
              busyPlanId={busy}
              actionLabel={subscription ? 'Change plan' : 'Subscribe'}
              onChoose={(plan, interval) => void choose(plan, interval)}
              freeTo={user ? '/platform' : '/register'}
              requestTo={user ? '/platform/support' : '/contact'}
            />
          </div>
        </section>

        <section className="section-py pt-0">
          <div className="container-px mx-auto max-w-page">
            <SectionHeader eyebrow="One-time" title="Prefer to pay once?" align="center" className="mx-auto mb-10" />
            <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
              {oneTime.map((option) => (
                <PricingTierCard key={option.name} {...option} highlighted={false} />
              ))}
            </div>
            <p className="mt-8 text-center text-[13.5px] text-navy/45">
              <Link to="/refund-policy" className="underline hover:text-navy">
                Refund Policy
              </Link>
            </p>
          </div>
        </section>

        <section className="section-py bg-bg-soft">
          <div className="container-px mx-auto max-w-narrow">
            <SectionHeader eyebrow="FAQ" title="Good to know" align="center" className="mx-auto mb-10" />
            <FAQ items={PLAN_FAQ} />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="Pricing"
        description="Simple BGrowth pricing — a free account, Workspaces you buy once and keep, and bundles that save more. No subscription."
        keywords={['bgrowth pricing', 'workspace pricing', 'bgrowth bundles']}
        path="/pricing"
      />

      <section className="container-px mx-auto max-w-page text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mx-auto mt-2 max-w-xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Simple, straightforward pricing.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-navy/55">
          Start free. Pay once for what you need — and keep it. No subscription.
        </p>
      </section>

      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {OPTIONS.map((option) => (
              <PricingTierCard key={option.name} {...option} />
            ))}
          </div>
          <p className="mt-8 text-center text-[13.5px] text-navy/45">
            Monthly plans are coming soon.{' '}
            <Link to="/refund-policy" className="underline hover:text-navy">
              Refund Policy
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-narrow">
          <SectionHeader eyebrow="FAQ" title="Good to know" align="center" className="mx-auto mb-10" />
          <FAQ items={PRICING_FAQ} />
        </div>
      </section>
    </div>
  )
}
