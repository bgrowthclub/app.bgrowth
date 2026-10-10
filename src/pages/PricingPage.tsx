import { Link } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import SectionHeader from '../components/ui/SectionHeader'
import PricingTierCard from '../components/ui/PricingTierCard'
import FAQ from '../components/ui/FAQ'
import { MEMBERSHIP_PLANS, formatPlanPrice } from '../data/membershipPlans'
import { REFUND_WINDOW_DAYS } from '../data/legal'

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
      `${REFUND_WINDOW_DAYS}-day refund`,
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
    answer: `Yes — within ${REFUND_WINDOW_DAYS} days of your purchase. See our Refund Policy for the details.`,
  },
]

export default function PricingPage() {
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
