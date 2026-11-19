import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, LayoutGrid, LayoutTemplate, Search, ShoppingCart, Signpost, Smartphone, Users, type LucideIcon } from 'lucide-react'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

// "Everything has a purpose" — the three pillars (05/11/2026).
//
// WHAT IS AND ISN'T BUILT. Four of these products don't exist yet: App,
// Marketplace, Club and Find. The owner chose to show them with an honest
// "Coming soon" instead of hiding them or pretending — so a card without a
// `to` is not a link, carries the badge, and offers the newsletter rather
// than dropping the visitor on an empty page. When one of them ships, give
// its entry a `to` and delete `soon`; nothing else changes.

interface Product {
  name: string
  blurb: string
  icon: LucideIcon
  to?: string
  soon?: boolean
}

interface Pillar {
  number: string
  eyebrow: string
  title: string
  highlight: string
  blurb: string
  /** Tag and icon colors (19/11/2026, the owner's design). */
  tag: string
  icon: string
  products: Product[]
}

const PILLARS: Pillar[] = [
  {
    number: '01',
    eyebrow: 'Learn & Build',
    title: 'Gain knowledge and build the systems behind',
    highlight: 'your growth.',
    blurb: 'Learn new skills, use practical tools and read free guides to turn goals into real progress.',
    tag: 'bg-violet-50 text-violet-600',
    icon: 'bg-violet-50 text-violet-600',
    products: [
      { name: 'BGrowth Academy™', blurb: 'Courses and structured programs for real-world skills.', icon: GraduationCap, to: '/academy' },
      { name: 'BGrowth Workspaces™', blurb: 'Interactive tools to plan, organize and get work done.', icon: LayoutGrid, to: '/systems?type=workspace' },
      { name: 'BGrowth Knowledge™', blurb: 'Free guides, articles and resources to keep you moving.', icon: BookOpen, to: '/knowledge' },
    ],
  },
  {
    number: '02',
    eyebrow: 'Market & Attract',
    title: 'Get discovered, attract customers and',
    highlight: 'make sales.',
    blurb: 'Reach new customers, sell what you offer and build a professional presence online.',
    tag: 'bg-emerald-50 text-emerald-600',
    icon: 'bg-emerald-50 text-emerald-600',
    products: [
      { name: 'BGrowth Pages™', blurb: 'A page of your own to show your work and be contacted.', icon: LayoutTemplate, to: '/pages' },
      { name: 'BGrowth Find™', blurb: 'Be found by customers looking for what you do.', icon: Search, soon: true },
      { name: 'BGrowth Marketplace™', blurb: 'Sell physical and digital products.', icon: ShoppingCart, soon: true },
    ],
  },
  {
    number: '03',
    eyebrow: 'Operate & Scale',
    title: 'Run and manage',
    highlight: 'your business.',
    blurb: 'Keep everything in one place: clients, work, money and the goals behind them.',
    tag: 'bg-blue-50 text-primary',
    icon: 'bg-blue-50 text-primary',
    products: [
      { name: 'BGrowth App™', blurb: 'Clients, projects, tasks and finances in one place.', icon: Smartphone, soon: true },
      { name: 'BGrowth Club™', blurb: 'People on the same journey, sharing what works.', icon: Users, soon: true },
      // Built but not open yet (Portal migration 0068 not applied) — "coming
      // soon" until it is, then give it back `to: '/journeys'`.
      { name: 'BGrowth Journeys™', blurb: 'A guided path to a goal, one step at a time.', icon: Signpost, soon: true },
    ],
  },
]

export default function HomePillars() {
  const t = usePageTexts()

  return (
    // id="solutions": the top menu's "Solutions" scrolls here.
    <section id="solutions" className="section-py scroll-mt-24 bg-white">
      <div className="container-px mx-auto max-w-page">
        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp} className="text-center">
          <p className="mx-auto w-fit rounded-full border border-primary/15 bg-bg-soft px-3.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary">
            {t.text('home.pillars.eyebrow')}
          </p>
          <h2 className="mt-3 font-display text-[30px] font-extrabold tracking-tight text-navy sm:text-[38px]">
            {t.text('home.pillars.title')} <span className="text-primary">{t.text('home.pillars.highlight')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-navy/60">{t.text('home.pillars.subtitle')}</p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <motion.article
              key={pillar.number}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={fadeUp}
              custom={i}
              className="flex flex-col rounded-[24px] border border-navy/[0.08] bg-white p-6 shadow-softer sm:p-7"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-md px-2.5 py-1 font-mono text-[11.5px] font-bold uppercase tracking-wide ${pillar.tag}`}>
                  {pillar.number} {pillar.eyebrow}
                </span>
                {pillar.products.every((p) => !p.soon) && (
                  <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-600">
                    <CheckCircle2 size={14} aria-hidden /> Available now
                  </span>
                )}
              </div>
              <h3 className="mt-5 font-display text-[21px] font-bold leading-snug tracking-tight text-navy">
                {pillar.title} {pillar.highlight}
              </h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-navy/55">{pillar.blurb}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {pillar.products.map((product) => (
                  <li key={product.name}>
                    <ProductRow product={product} tone={pillar.icon} />
                  </li>
                ))}
              </ul>

              <p className="mt-6 flex items-center justify-between border-t border-navy/[0.07] pt-4 text-[13px] text-navy/50">
                <span>{pillar.eyebrow}</span>
                <span className="font-semibold text-navy/70">
                  {pillar.products.filter((p) => !p.soon).length} of {pillar.products.length} available now
                </span>
              </p>
            </motion.article>
          ))}
        </div>

        <p className="mt-8 text-center text-[13.5px] text-navy/45">{t.text('home.pillars.soonNote')}</p>
      </div>
    </section>
  )
}

function ProductRow({ product, tone }: { product: Product; tone: string }) {
  const Icon = product.icon
  const body = (
    <span className="flex items-start gap-3.5">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${product.soon ? 'bg-navy/[0.04] text-navy/40' : tone}`}>
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-[14px] font-bold text-navy">{product.name}</span>
          {product.soon ? (
            <span className="shrink-0 rounded-md bg-navy/[0.05] px-2 py-0.5 text-[10.5px] font-bold text-navy/45">Coming soon</span>
          ) : (
            <ArrowRight size={15} className="mt-0.5 shrink-0 text-navy/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
          )}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-navy/55">{product.blurb}</span>
      </span>
    </span>
  )

  // Not built yet: a card, not a link. Clicking through to an empty page
  // costs more trust than the honest badge does.
  const box = 'block rounded-2xl border border-navy/[0.07] bg-white px-4 py-3.5'
  if (!product.to) return <span className={`${box} bg-bg-soft/60`}>{body}</span>
  return (
    <Link to={product.to} className={`group ${box} transition-all hover:border-primary/20 hover:shadow-soft`}>
      {body}
    </Link>
  )
}
