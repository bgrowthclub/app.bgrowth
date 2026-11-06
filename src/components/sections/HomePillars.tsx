import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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
  to?: string
  soon?: boolean
}

interface Pillar {
  number: string
  eyebrow: string
  title: string
  highlight: string
  blurb: string
  tint: string
  accent: string
  products: Product[]
}

const PILLARS: Pillar[] = [
  {
    number: '01',
    eyebrow: 'Learn & Build',
    title: 'Gain knowledge and build the systems behind',
    highlight: 'your growth.',
    blurb: 'Learn new skills, use practical tools and read free guides to turn goals into real progress.',
    tint: 'from-violet-500/[0.07]',
    accent: 'text-violet-600',
    products: [
      { name: 'BGrowth Academy™', blurb: 'Courses and structured programs for real-world skills.', to: '/systems?type=course' },
      { name: 'BGrowth Workspaces™', blurb: 'Interactive tools to plan, organize and get work done.', to: '/systems?type=workspace' },
      { name: 'BGrowth Knowledge™', blurb: 'Free guides, articles and resources to keep you moving.', to: '/knowledge' },
    ],
  },
  {
    number: '02',
    eyebrow: 'Market',
    title: 'Get discovered, attract customers and',
    highlight: 'make sales.',
    blurb: 'Reach new customers, sell what you offer and build a professional presence online.',
    tint: 'from-emerald-500/[0.07]',
    accent: 'text-emerald-600',
    products: [
      { name: 'BGrowth Pages™', blurb: 'A page of your own to show your work and be contacted.', to: '/register?next=/platform/my-page' },
      { name: 'BGrowth Find™', blurb: 'Be found by customers looking for what you do.', soon: true },
      { name: 'BGrowth Marketplace™', blurb: 'Sell physical and digital products.', soon: true },
    ],
  },
  {
    number: '03',
    eyebrow: 'Operate',
    title: 'Run and manage',
    highlight: 'your business.',
    blurb: 'Keep everything in one place: clients, work, money and the goals behind them.',
    tint: 'from-primary/[0.07]',
    accent: 'text-primary',
    products: [
      { name: 'BGrowth App™', blurb: 'Clients, projects, tasks and finances in one place.', soon: true },
      { name: 'BGrowth Club™', blurb: 'People on the same journey, sharing what works.', soon: true },
      { name: 'BGrowth Journeys™', blurb: 'A guided path to a goal, one step at a time.', to: '/journeys' },
    ],
  },
]

export default function HomePillars() {
  const t = usePageTexts()

  return (
    // id="solutions": the top menu's "Solutions" scrolls here.
    <section id="solutions" className="section-py bg-bg-soft scroll-mt-24">
      <div className="container-px mx-auto max-w-page">
        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp} className="text-center">
          <p className="eyebrow">{t.text('home.pillars.eyebrow')}</p>
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
              className={`flex flex-col rounded-xl2 border border-navy/[0.07] bg-gradient-to-b ${pillar.tint} to-white px-7 py-8 shadow-soft`}
            >
              <p className="flex items-baseline gap-3">
                <span className={`font-display text-[40px] font-extrabold leading-none tracking-tight ${pillar.accent} opacity-25`}>
                  {pillar.number}
                </span>
                <span className={`text-[12px] font-bold uppercase tracking-[0.18em] ${pillar.accent}`}>{pillar.eyebrow}</span>
              </p>
              <h3 className="mt-4 font-display text-[25px] font-extrabold leading-tight tracking-tight text-navy">
                {pillar.title} <span className={pillar.accent}>{pillar.highlight}</span>
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-navy/60">{pillar.blurb}</p>

              <ul className="mt-7 space-y-2.5">
                {pillar.products.map((product, p) => (
                  <li key={product.name}>
                    <ProductRow product={product} lead={p === 0} />
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>

        <p className="mt-8 text-center text-[13.5px] text-navy/45">{t.text('home.pillars.soonNote')}</p>
      </div>
    </section>
  )
}

function ProductRow({ product, lead }: { product: Product; lead?: boolean }) {
  const body = (
    <>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`font-bold text-navy ${lead ? 'text-[16px]' : 'text-[14.5px]'}`}>{product.name}</span>
        {product.soon && (
          <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-navy/45">
            Coming soon
          </span>
        )}
      </span>
      <span className="mt-0.5 block text-[13.5px] leading-snug text-navy/55">{product.blurb}</span>
    </>
  )

  // Not built yet: a card, not a link. Clicking through to an empty page
  // costs more trust than the honest badge does.
  const box = lead ? 'px-4 py-3.5' : 'px-4 py-3'
  if (!product.to) return <span className={`block rounded-xl bg-white/70 ${box}`}>{body}</span>

  return (
    <Link
      to={product.to}
      className={`group block rounded-xl bg-white ${box} transition-shadow hover:shadow-md`}
    >
      {body}
      <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
        Open
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}
