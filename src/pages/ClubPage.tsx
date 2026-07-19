import { Tag, Zap, Gem, FileText, Library, Users, CalendarClock, Headphones, Check, Minus } from 'lucide-react'
import SEO from '../components/seo/SEO'
import SectionContainer from '../components/layout/SectionContainer'
import SectionHeader from '../components/ui/SectionHeader'
import FeatureGrid from '../components/ui/FeatureGrid'
import PricingTierCard from '../components/ui/PricingTierCard'
import FAQ from '../components/ui/FAQ'
import PremiumCTA from '../components/ui/PremiumCTA'
import Badge from '../components/ui/Badge'
import ClubHero from '../components/club/ClubHero'
import type { SystemBenefit } from '../types/system'

const WHY_JOIN = [
  { icon: Tag, title: 'Exclusive Discounts', description: 'Member pricing applied automatically on every eligible Business System.' },
  { icon: Zap, title: 'Early Access', description: 'Try new Business Systems and features before they’re publicly released.' },
  { icon: Gem, title: 'Premium Resources', description: 'Resources reserved for members only — not sold or offered anywhere else.' },
  { icon: FileText, title: 'Member-only Templates', description: 'Professional templates that go beyond what’s available for free.' },
  { icon: Library, title: 'Learning Library', description: 'A growing collection of practical, no-fluff learning content.' },
  { icon: Users, title: 'Professional Community', description: 'Connect with other members building and growing the same way you are.' },
  { icon: CalendarClock, title: 'Monthly Updates', description: 'New systems, templates and resources added to your membership every month.' },
  { icon: Headphones, title: 'Priority Support', description: 'Jump the queue — member questions get answered first.' },
]

const EVERYTHING_INCLUDED: SystemBenefit[] = [
  { title: 'Business Systems', description: 'Full access to the growing catalog of interactive Business Systems.' },
  { title: 'Interactive Checklists', description: 'Work through launch and operations steps right in your browser.' },
  { title: 'Professional Templates', description: 'Documents and worksheets ready to use the moment you need them.' },
  { title: 'Digital Downloads', description: 'Save or print anything in your membership, anytime.' },
  { title: 'Learning Resources', description: 'Guides and articles built around real decisions, not theory.' },
  { title: 'Exclusive Courses', description: 'Structured learning content available only to members.' },
  { title: 'Marketplace Benefits', description: 'Member pricing and early access across the BGrowth Marketplace.' },
  { title: 'Future Member Perks', description: 'Everything added to membership going forward, at no extra cost.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$19',
    priceNote: '/month',
    description: 'For getting started with the essentials.',
    features: ['Access to free & starter Business Systems', 'Member pricing on select systems', 'Monthly newsletter', 'Community access'],
    ctaLabel: 'Start with Starter',
    ctaTo: '/#become-a-member',
  },
  {
    name: 'Pro',
    price: '$49',
    priceNote: '/month',
    description: 'For professionals who want it all.',
    features: [
      'Everything in Starter',
      'Unlimited premium Business Systems',
      'Member pricing on everything',
      'Exclusive Resources™',
      'Priority support',
      'Early access to new releases',
    ],
    ctaLabel: 'Become a Pro Member',
    ctaTo: '/#become-a-member',
    highlighted: true,
    badge: <Badge variant="solid">Recommended</Badge>,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams and growing organizations.',
    features: [
      'Everything in Pro',
      'Team seats & shared access',
      'Dedicated onboarding',
      'Custom resource requests',
      'Priority roadmap input',
    ],
    ctaLabel: 'Talk to Us',
    ctaTo: '/contact',
  },
]

const COMPARISON_ROWS = [
  { label: 'Free Business Systems', starter: true, pro: true, enterprise: true },
  { label: 'Member pricing on every system', starter: false, pro: true, enterprise: true },
  { label: 'Exclusive Resources™', starter: false, pro: true, enterprise: true },
  { label: 'Priority support', starter: false, pro: true, enterprise: true },
  { label: 'Early access to new releases', starter: false, pro: true, enterprise: true },
  { label: 'Team seats & shared access', starter: false, pro: false, enterprise: true },
  { label: 'Dedicated onboarding', starter: false, pro: false, enterprise: true },
]

const CLUB_FAQ = [
  {
    question: 'What is BGrowth Club?',
    answer:
      'BGrowth Club is BGrowth’s membership program — one place for member pricing, exclusive resources, and a growing library of Business Systems, all included as long as you’re a member.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Cancel anytime and keep access through the end of your current billing period — no long-term contract required.',
  },
  {
    question: 'What is included?',
    answer:
      'Every plan includes access to Business Systems, templates, and learning resources. Higher tiers add unlimited access, priority support, and early releases.',
  },
  {
    question: 'Do I keep downloaded resources?',
    answer: 'Yes. Anything you’ve downloaded or completed while a member is yours to keep, even if your membership later lapses.',
  },
  {
    question: 'How do member discounts work?',
    answer: 'Member pricing is applied automatically at checkout on every eligible Business System and template — no codes to remember.',
  },
  {
    question: 'Will new benefits be added?',
    answer: 'Yes. New Business Systems, templates, and resources are added regularly, and current members get access as soon as they launch.',
  },
]

function ComparisonCell({ value }: { value: boolean }) {
  return value ? (
    <Check size={16} className="mx-auto text-primary" strokeWidth={2.5} aria-hidden="true" />
  ) : (
    <Minus size={14} className="mx-auto text-navy/20" aria-hidden="true" />
  )
}

export default function ClubPage() {
  return (
    <div>
      <SEO
        title="Join BGrowth Club"
        description="BGrowth Club membership — exclusive resources, premium Business Systems, member pricing, and a growing professional community."
        keywords={['bgrowth club', 'bgrowth membership', 'join bgrowth']}
        path="/club"
      />

      <ClubHero />

      <SectionContainer aria-label="Why Join">
        <SectionHeader
          eyebrow="Why Join?"
          title="Membership built for continuous growth."
          description="Not a one-time purchase — an ongoing relationship with everything BGrowth builds next."
          className="mb-10"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_JOIN.map((item) => (
            <div key={item.title} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-bg-soft text-primary">
                <item.icon size={17} strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-[15px] font-bold text-navy">{item.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{item.description}</p>
            </div>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer background="soft" aria-label="Everything Included">
        <SectionHeader eyebrow="Everything Included" title="What every member gets." className="mb-10" />
        <FeatureGrid features={EVERYTHING_INCLUDED} />
      </SectionContainer>

      <SectionContainer id="plans" aria-label="Membership Plans">
        <SectionHeader
          eyebrow="Membership Plans"
          title="Choose the plan that fits where you are."
          description="Start small, go unlimited, or bring your whole team — upgrade or cancel anytime."
          align="center"
          className="mx-auto mb-10"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PricingTierCard key={plan.name} {...plan} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer background="soft" aria-label="Compare Plans">
        <SectionHeader eyebrow="Compare Plans" title="See the full breakdown." align="center" className="mx-auto mb-10" />
        <div className="overflow-x-auto rounded-xl3 border border-navy/[0.06] bg-white shadow-softer">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-navy/[0.06]">
                <th className="px-6 py-4 text-[12.5px] font-semibold text-navy/50">Feature</th>
                <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-navy/50">Starter</th>
                <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-primary">Pro</th>
                <th className="px-6 py-4 text-center text-[12.5px] font-semibold text-navy/50">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-navy/[0.04] last:border-0">
                  <td className="px-6 py-4 text-[13.5px] text-navy/70">{row.label}</td>
                  <td className="px-6 py-4">
                    <ComparisonCell value={row.starter} />
                  </td>
                  <td className="px-6 py-4">
                    <ComparisonCell value={row.pro} />
                  </td>
                  <td className="px-6 py-4">
                    <ComparisonCell value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionContainer>

      <SectionContainer width="narrow" aria-label="Frequently Asked Questions">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions." align="center" className="mx-auto mb-10" />
        <FAQ items={CLUB_FAQ} />
      </SectionContainer>

      <SectionContainer aria-label="Start Growing With BGrowth" className="!pt-0">
        <PremiumCTA
          eyebrow="BGROWTH CLUB™"
          title="Start Growing With BGrowth Today"
          description="Join a community built to help professionals discover opportunities, learn faster, build better businesses and continue growing every day."
          primaryLabel="Become a Member"
          primaryTo="/#become-a-member"
          secondaryLabel="Contact Us"
          secondaryTo="/contact"
        />
      </SectionContainer>
    </div>
  )
}
