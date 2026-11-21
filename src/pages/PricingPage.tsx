import { useEffect, useState } from 'react'
import { ArrowRight, Check, Gift, LayoutGrid, RefreshCcw, Sparkles, Zap } from 'lucide-react'
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
import { loadBundleProducts, loadStudioWorkspaceProducts } from '../lib/publishedCatalog'
import { useNewsletterSignup } from '../modules/newsletter/useNewsletterSignup'
import SignupInterests from '../components/newsletter/SignupInterests'
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
    question: 'How do I pay?',
    answer: 'Through Stripe’s secure checkout. The payment options shown there depend on your country and device. We never see or keep your card details.',
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
  const signup = useNewsletterSignup('pricing')
  // Counted from the published catalog (21/11/2026) — never written by hand.
  const [catalog, setCatalog] = useState<{ products: number; free: number } | null>(null)
  useEffect(() => {
    let cancelled = false
    Promise.all([loadStudioWorkspaceProducts(), loadBundleProducts().catch(() => [])])
      .then(([products, bundles]) => {
        if (cancelled) return
        setCatalog({ products: products.length, free: products.filter((p) => p.basePrice === 0).length + bundles.filter((b) => b.basePrice === 0).length })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
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
    const facts = [
      catalog && { icon: LayoutGrid, value: String(catalog.products), label: catalog.products === 1 ? 'Product in the catalog' : 'Products in the catalog' },
      catalog && catalog.free > 0 && { icon: Gift, value: String(catalog.free), label: catalog.free === 1 ? 'Free to start with' : 'Free to start with' },
      { icon: Zap, value: 'Instant', label: 'Access right after you join' },
      { icon: RefreshCcw, value: 'Anytime', label: 'Cancel or change your plan' },
    ].filter(Boolean) as { icon: typeof Zap; value: string; label: string }[]

    return (
      <div className="pb-24">
        <SEO
          title="Pricing"
          description="BGrowth plans — start free, subscribe for more, or buy a Workspace once and keep it."
          keywords={['bgrowth pricing', 'bgrowth plans', 'workspace pricing']}
          path="/pricing"
        />
        <section className="bg-grad-radial-soft pb-10 pt-28 text-center md:pb-12 md:pt-36">
          <div className="container-px mx-auto max-w-3xl">
            <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-wide text-primary">
              <Sparkles size={13} aria-hidden /> Plans &amp; one-time options
            </p>
            <h1 className="mt-5 font-display text-[34px] font-bold leading-[1.1] tracking-tight text-navy sm:text-[50px]">
              Choose the plan that
              <br />
              <span className="text-primary">fits your growth.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-navy/60 sm:text-[17px]">
              Start free. Subscribe when you want more — cancel anytime. Or buy a single Workspace once and keep it.
            </p>
          </div>
        </section>

        <section className="pb-14">
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

        <section className="border-y border-navy/[0.06] bg-bg-soft py-10">
          <div className="container-px mx-auto grid max-w-page grid-cols-2 gap-6 md:grid-cols-4">
            {facts.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <Icon size={20} className="text-primary" aria-hidden />
                <p className="mt-2 font-display text-[26px] font-bold text-navy">{value}</p>
                <p className="text-[13px] text-navy/55">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container-px mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">One-time options</p>
              <h2 className="mt-2 font-display text-[28px] font-bold text-navy sm:text-[36px]">Prefer to pay once?</h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-navy/55">
                Buy the Workspace you need, or a bundle of them, with lifetime access and no subscription.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {oneTime.map((option, i) => (
                <div
                  key={option.name}
                  className={`flex flex-col rounded-[22px] bg-white p-6 sm:p-7 ${i === 1 ? 'border-2 border-indigo-500/70 shadow-glow' : 'border border-navy/[0.08] shadow-softer'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${i === 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-primary'}`}>
                      {i === 1 ? 'Bundles' : 'One-time access'}
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-[22px] font-bold text-navy">{option.price}</span>
                      <span className="block text-[12px] text-navy/45">{option.priceNote}</span>
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[20px] font-bold text-navy">{option.name}</h3>
                  <p className="mt-1.5 text-[14px] text-navy/55">{option.description}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {option.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[14px] text-navy/75">
                        <Check size={16} className={`mt-0.5 shrink-0 ${i === 1 ? 'text-indigo-600' : 'text-primary'}`} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={option.ctaTo}
                    className={`mt-6 flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold transition-opacity ${
                      i === 1 ? 'bg-indigo-600 text-white shadow-softer hover:opacity-95' : 'border border-navy/10 bg-white text-navy hover:border-primary/25'
                    }`}
                  >
                    {option.ctaLabel} <ArrowRight size={15} aria-hidden />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-bg-soft py-16 md:py-20">
          <div className="container-px mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">Frequently asked questions</p>
              <h2 className="mt-2 font-display text-[28px] font-bold text-navy sm:text-[36px]">Good to know</h2>
              <p className="mt-3 text-[15px] text-navy/55">Billing, cancelling, and what stays yours.</p>
            </div>
            <div className="mt-10">
              <FAQ items={PLAN_FAQ} />
            </div>
            <p className="mt-6 text-center text-[13.5px] text-navy/45">
              <Link to="/refund-policy" className="underline hover:text-navy">
                Refund Policy
              </Link>
            </p>
          </div>
        </section>

        <section className="pt-16">
          <div className="container-px mx-auto max-w-5xl">
            <div className="flex flex-col gap-6 rounded-[28px] bg-gradient-to-r from-primary to-indigo-600 p-7 text-white shadow-glow sm:p-10 md:flex-row md:items-center md:justify-between">
              <div className="max-w-md">
                <p className="w-fit rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">Newsletter</p>
                <h2 className="mt-3 font-display text-[24px] font-bold leading-tight sm:text-[28px]">Get new Workspaces and guides first</h2>
                <p className="mt-2 text-[14.5px] text-white/80">News from BGrowth in the areas you pick. Unsubscribe anytime.</p>
              </div>
              <div className="w-full md:max-w-sm">
                <form onSubmit={signup.submit} className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={signup.email}
                    onChange={(e) => signup.setEmail(e.target.value)}
                    aria-label="E-mail address"
                    placeholder="Your e-mail address"
                    className="min-w-0 flex-1 rounded-xl border-0 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                  <button type="submit" className="shrink-0 rounded-xl bg-navy px-5 py-3 text-[14px] font-semibold text-white hover:bg-navy/90">
                    {signup.state === 'sending' ? 'Sending…' : signup.done ? 'Subscribed' : 'Subscribe'}
                  </button>
                </form>
                {signup.message && <p className="mt-2 text-[13px] text-white/85">{signup.message}</p>}
                {signup.token && (
                  <div className="mt-3 rounded-xl bg-white p-3 text-navy">
                    <SignupInterests token={signup.token} />
                  </div>
                )}
              </div>
            </div>
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
