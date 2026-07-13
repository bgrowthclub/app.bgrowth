import { Check, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import SectionHeader from '../components/ui/SectionHeader'
import PricingTierCard from '../components/ui/PricingTierCard'
import FAQ from '../components/ui/FAQ'
import MemberBanner from '../components/ui/MemberBanner'
import Badge from '../components/ui/Badge'

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    priceNote: 'forever',
    description: 'Get started before you buy anything.',
    features: ['Free Business Systems', 'Free Resources™', 'Newsletter', 'Club updates'],
    ctaLabel: 'Browse Free Systems',
    ctaTo: '/systems',
  },
  {
    name: 'Buy Individually',
    price: 'From $39',
    priceNote: 'one-time',
    description: 'Own exactly the systems you need.',
    features: ['Own the Business System', 'No subscription', 'Lifetime access', 'Download anytime'],
    ctaLabel: 'Browse Business Systems',
    ctaTo: '/systems',
    highlighted: true,
    badge: <Badge variant="solid">Most Popular</Badge>,
  },
  {
    name: 'BGrowth Club',
    price: 'Membership',
    description: 'Everything, for less, as you grow.',
    features: [
      'Unlimited premium Business Systems',
      'Member pricing on every system',
      'Exclusive Resources™',
      'Future courses',
      'Club community',
      'Priority updates',
    ],
    ctaLabel: 'Join BGrowth Club',
    ctaTo: '/#become-a-member',
  },
]

const COMPARISON_ROWS = [
  { label: 'Access individual Business Systems', free: false, individual: true, club: true },
  { label: 'Member pricing on every system', free: false, individual: false, club: true },
  { label: 'Free resources & templates', free: true, individual: true, club: true },
  { label: 'Exclusive member-only resources', free: false, individual: false, club: true },
  { label: 'Newsletter & Club updates', free: true, individual: true, club: true },
  { label: 'Future courses', free: false, individual: false, club: true },
]

const PRICING_FAQ = [
  { question: 'Is BGrowth Club a subscription?', answer: 'Yes — it renews on a recurring schedule and unlocks member pricing and exclusive resources across every Business System.' },
  { question: 'Do individually purchased systems expire?', answer: 'No. Buying a system individually gives you lifetime access to that system, with no subscription required.' },
  { question: 'Can I cancel BGrowth Club anytime?', answer: 'Yes, you can cancel anytime — you\u2019ll keep access through the end of your current billing period.' },
  { question: 'What\u2019s included for free?', answer: 'A rotating set of free Business Systems, free resources and templates, and our newsletter — no purchase required.' },
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
        description="Simple BGrowth pricing — free resources, buy Business Systems individually, or join BGrowth Club for member pricing on everything."
        keywords={['bgrowth pricing', 'business systems pricing', 'bgrowth club membership']}
        path="/pricing"
      />

      <section className="container-px mx-auto max-w-page text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mx-auto mt-2 max-w-xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Simple, straightforward pricing.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-navy/55">
          Start free, buy exactly what you need, or go unlimited with BGrowth Club.
        </p>
      </section>

      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <PricingTierCard key={tier.name} {...tier} />
            ))}
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
                  <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-navy/50">Individually</th>
                  <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-primary">Club</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-navy/[0.04] last:border-0">
                    <td className="px-6 py-4 text-[13.5px] text-navy/70">{row.label}</td>
                    <td className="px-6 py-4"><ComparisonCell value={row.free} /></td>
                    <td className="px-6 py-4"><ComparisonCell value={row.individual} /></td>
                    <td className="px-6 py-4"><ComparisonCell value={row.club} /></td>
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
            eyebrow="BGrowth Club"
            title="Ready to go unlimited?"
            description="Join BGrowth Club for member pricing on every Business System, plus exclusive resources."
            footnote="Cancel anytime."
          >
            <Link to="/#become-a-member" className="btn-primary w-full">
              Join BGrowth Club
            </Link>
          </MemberBanner>
        </div>
      </section>
    </div>
  )
}
