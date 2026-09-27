import { Check, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import SectionHeader from '../components/ui/SectionHeader'
import PricingTierCard from '../components/ui/PricingTierCard'
import FAQ from '../components/ui/FAQ'
import MemberBanner from '../components/ui/MemberBanner'
import Badge from '../components/ui/Badge'
import { MEMBERSHIP_PLANS, formatPlanPrice, formatPlanRegularPrice } from '../data/membershipPlans'

// Plans, prices and promotions come from data/membershipPlans.ts — the one
// place they are edited. This page only decides how each plan is presented.
const PLAN_PRESENTATION: Record<string, { priceNote?: string; ctaLabel: string; ctaTo: string; highlighted?: boolean }> = {
  free: { priceNote: 'forever', ctaLabel: 'Start Free', ctaTo: '/register' },
  starter: { priceNote: '/month', ctaLabel: 'Choose Starter', ctaTo: '/register' },
  pro: { priceNote: '/month', ctaLabel: 'Choose Pro', ctaTo: '/register', highlighted: true },
  enterprise: { ctaLabel: 'Talk to Us', ctaTo: '/contact' },
}

const TIERS = MEMBERSHIP_PLANS.filter((plan) => plan.status === 'published').map((plan) => {
  const presentation = PLAN_PRESENTATION[plan.tier]
  return {
    name: plan.name,
    price: formatPlanPrice(plan) ?? 'Custom',
    regularPrice: formatPlanRegularPrice(plan),
    priceNote: presentation.priceNote,
    description: plan.description,
    features: plan.features,
    ctaLabel: presentation.ctaLabel,
    ctaTo: presentation.ctaTo,
    highlighted: presentation.highlighted,
    badge: presentation.highlighted ? <Badge variant="solid">Recommended</Badge> : undefined,
  }
})

const COMPARISON_ROWS = [
  { label: 'Free Business Systems & resources', free: true, starter: true, pro: true, enterprise: true },
  { label: 'Newsletter', free: true, starter: true, pro: true, enterprise: true },
  { label: 'Community access', free: false, starter: true, pro: true, enterprise: true },
  { label: 'Member pricing on Business Systems', free: false, starter: true, pro: true, enterprise: true },
  { label: 'Unlimited premium Business Systems', free: false, starter: false, pro: true, enterprise: true },
  { label: 'Exclusive Resources™', free: false, starter: false, pro: true, enterprise: true },
  { label: 'Priority support', free: false, starter: false, pro: true, enterprise: true },
  { label: 'Team seats & shared access', free: false, starter: false, pro: false, enterprise: true },
]

const PRICING_FAQ = [
  { question: 'Are Starter and Pro subscriptions?', answer: 'Yes — they renew monthly and unlock member pricing and the benefits of your plan.' },
  { question: 'Can I buy a single Business System without a plan?', answer: 'Yes. Any Business System can be bought individually, with lifetime access and no subscription.' },
  { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel anytime — you\u2019ll keep access through the end of your current billing period.' },
  { question: 'What\u2019s included for free?', answer: 'Free Business Systems, free resources and templates, and our newsletter — no purchase required.' },
]

function ComparisonCell({ value }: { value: boolean }) {
  return value ? (
    <Check size={16} className="mx-auto text-primary" strokeWidth={2.5} />
  ) : (
    <Minus size={14} className="mx-auto text-navy/20" />
  )
}

export default function PricingPage() {
  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="Pricing"
        description="Simple BGrowth pricing — free resources, buy Business Systems individually, or choose a Starter or Pro plan for member pricing."
        keywords={['bgrowth pricing', 'business systems pricing', 'bgrowth plans']}
        path="/pricing"
      />

      <section className="container-px mx-auto max-w-page text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mx-auto mt-2 max-w-xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Simple, straightforward pricing.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-navy/55">
          Start free, buy exactly what you need, or choose the plan that fits how you grow.
        </p>
      </section>

      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {TIERS.map((tier) => (
              <PricingTierCard key={tier.name} {...tier} />
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl3 border border-navy/[0.06] bg-bg-soft p-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-display text-[16px] font-bold text-navy">Prefer to own a single system?</p>
              <p className="mt-1 text-[13.5px] text-navy/55">
                Buy any Business System individually — one-time payment, lifetime access, no subscription.
              </p>
            </div>
            <Link to="/systems" className="btn-secondary shrink-0">
              Browse Business Systems
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="Compare" title="What's included" align="center" className="mx-auto mb-10" />
          <div className="overflow-x-auto rounded-xl3 border border-navy/[0.06] bg-white shadow-softer">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-navy/[0.06]">
                  <th className="px-6 py-4 text-[12.5px] font-semibold text-navy/50">Feature</th>
                  <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-navy/50">Free</th>
                  <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-navy/50">Starter</th>
                  <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-primary">Pro</th>
                  <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-navy/50">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-navy/[0.04] last:border-0">
                    <td className="px-6 py-4 text-[13.5px] text-navy/70">{row.label}</td>
                    <td className="px-6 py-4"><ComparisonCell value={row.free} /></td>
                    <td className="px-6 py-4"><ComparisonCell value={row.starter} /></td>
                    <td className="px-6 py-4"><ComparisonCell value={row.pro} /></td>
                    <td className="px-6 py-4"><ComparisonCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-narrow">
          <SectionHeader eyebrow="FAQ" title="Good to know" align="center" className="mx-auto mb-10" />
          <FAQ items={PRICING_FAQ} />
        </div>
      </section>

      {/* CTA */}
      <section className="pb-4">
        <div className="container-px mx-auto max-w-page">
          <MemberBanner
            eyebrow="BGrowth Pro"
            title="Ready to go unlimited?"
            description="Go Pro for unlimited premium Business Systems and member pricing on everything."
            footnote="Cancel anytime."
          >
            <Link to="/register" className="btn-primary w-full">
              Choose Pro
            </Link>
          </MemberBanner>
        </div>
      </section>
    </div>
  )
}
