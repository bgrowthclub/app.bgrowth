import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Brush, Link2, Users } from 'lucide-react'
import pagesHero from '../assets/pages-hero.webp'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import { fadeUp, viewportOnce } from '../lib/motion'
import { getSiteAccess } from '../modules/site/siteService'
import { getPublishedMemberPage } from '../modules/find/memberPageService'
import type { MemberPage } from '../modules/find/types'

const CREATE_TO = '/register?next=/platform/my-page'

// BGrowth Pages™ — the public page (07/11/2026), from the owner's design.
//
// It closes the one gap the Home's pillars had: every other product led
// somewhere that explains it, and Pages pushed the visitor straight at the
// sign-up form with nothing shown first.
//
// The examples are REAL member pages — the ones the team marked as BGrowth
// Demo — read at load time, never a picture of invented ones. If none come
// back, the section and the "See Examples" button are simply not there.
export default function PagesPage() {
  const seo = seoPage('/pages')
  const [examples, setExamples] = useState<MemberPage[]>([])

  useEffect(() => {
    let cancelled = false
    getSiteAccess()
      .then(async ({ pages }) => {
        // Old addresses of the same page come back in this list too, and a
        // page redirects from them — so a page could appear twice. Four is
        // all the row shows.
        const found = await Promise.all(pages.slice(0, 8).map((slug) => getPublishedMemberPage(slug).catch(() => null)))
        const seen = new Set<string>()
        const unique = found.filter((p): p is MemberPage => {
          if (!p || seen.has(p.id)) return false
          seen.add(p.id)
          return true
        })
        if (!cancelled) setExamples(unique.slice(0, 4))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <SEO title={seo.title} description={seo.description} path="/pages" />

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-bg to-bg">
        <div className="container-px mx-auto max-w-page pb-6 pt-24 sm:pt-28">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
              <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-primary">BGrowth Pages</p>
              <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[1.04] tracking-tight text-navy sm:text-[54px]">
                Your business page.
                <br />
                <span className="text-primary">Your way.</span>
              </h1>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-navy/60">
                Create a professional page to showcase your services, connect with customers and share everything about
                your business — in one place.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to={CREATE_TO} className="btn-primary inline-flex items-center gap-2">
                  Create Your Page
                  <ArrowRight size={18} aria-hidden />
                </Link>
                {examples.length > 0 && (
                  <a
                    href="#examples"
                    className="inline-flex items-center rounded-full bg-primary/[0.08] px-5 py-3 text-[15px] font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    See Examples
                  </a>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="-mx-4 sm:mx-0 lg:-mr-12 xl:-mr-20"
            >
              <img
                src={pagesHero}
                alt=""
                width={1359}
                height={1152}
                fetchPriority="high"
                className="w-full max-w-none [mask-image:linear-gradient(to_right,transparent,black_10%),linear-gradient(to_top,transparent,black_8%)] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-bg pb-20 pt-6 md:pb-24">
        <div className="container-px mx-auto max-w-page">
          <div className="grid gap-8 border-t border-navy/[0.07] pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                variants={fadeUp}
                custom={i}
                className="flex gap-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08]">
                  <benefit.icon size={18} className="text-primary" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-[16px] font-bold text-navy">{benefit.title}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-navy/55">{benefit.body}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {examples.length > 0 && (
        <section id="examples" className="section-py scroll-mt-24 bg-bg-soft">
          <div className="container-px mx-auto max-w-page">
            <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp} className="text-center">
              <p className="eyebrow">Examples</p>
              <h2 className="mt-3 font-display text-[30px] font-extrabold tracking-tight text-navy sm:text-[36px]">
                Real pages, made with BGrowth.
              </h2>
            </motion.div>

            <ul className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
              {examples.map((page) => (
                <li key={page.id}>
                  <Link
                    to={`/p/${page.slug}`}
                    className="group flex h-full items-center gap-4 rounded-xl2 border border-navy/[0.07] bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-bg-soft">
                      {page.photo_url && <img src={page.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[17px] font-bold text-navy">{page.display_name}</span>
                      {page.headline && <span className="block truncate text-[14px] text-navy/55">{page.headline}</span>}
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary">
                        See the page
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-center">
              <Link to={CREATE_TO} className="btn-primary inline-flex items-center gap-2">
                Create Your Page
                <ArrowRight size={18} aria-hidden />
              </Link>
            </p>
          </div>
        </section>
      )}
    </>
  )
}

const BENEFITS = [
  {
    icon: Brush,
    title: 'Easy to create',
    body: 'Simple tools to build a page that fits your business. Pick a look, write your text, publish.',
  },
  {
    icon: Link2,
    title: 'One link for everything',
    body: 'Your services, portfolio, contact buttons and more, behind a single address you can share anywhere.',
  },
  {
    icon: Users,
    // BGrowth Find isn't built (the Home marks it "Coming soon"), so this
    // promises only what the page does today and names Find as coming.
    title: 'Reach more customers',
    body: 'Share one link anywhere you already are — and get found on BGrowth Find when it opens.',
  },
  {
    icon: BarChart3,
    title: 'Grow your opportunities',
    body: 'See how many people visit your page and what they click, and build your reputation from there.',
  },
]
