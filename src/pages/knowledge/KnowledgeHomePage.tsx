import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import { seoPage } from '../../data/seoPages'
import KnowledgeHero from '../../components/knowledge/KnowledgeHero'
import KnowledgeCategoryCard from '../../components/knowledge/KnowledgeCategoryCard'
import KnowledgeCoverCard from '../../components/knowledge/KnowledgeCoverCard'
import KnowledgeSpotlight from '../../components/knowledge/KnowledgeSpotlight'
import { knowledgeService } from '../../modules/knowledge/services/KnowledgeService'
import { KNOWLEDGE_TYPES } from '../../modules/knowledge/types/knowledgeType'
import type { KnowledgeType } from '../../modules/knowledge/types/knowledgeType'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import type { KnowledgeCategory } from '../../modules/knowledge/types/category'
import { useNewsletterSignup } from '../../modules/newsletter/useNewsletterSignup'
import SignupInterests from '../../components/newsletter/SignupInterests'

interface HomeData {
  articles: KnowledgeArticleIndexEntry[]
  hero: KnowledgeArticleIndexEntry[]
  featured: KnowledgeArticleIndexEntry[]
  categories: KnowledgeCategory[]
  counts: Record<string, number>
}

const PAGE = 6
const PLURAL: Record<KnowledgeType, string> = {
  Article: 'Articles',
  Guide: 'Guides',
  Checklist: 'Checklists',
  Planner: 'Planners',
  Calculator: 'Calculators',
  Template: 'Templates',
  Video: 'Videos',
  Download: 'Downloads',
}

type Filter = { kind: 'all' } | { kind: 'type'; type: KnowledgeType } | { kind: 'category'; slug: string }

// The Knowledge hub (redesigned 19/11/2026, the owner's design): a short page
// — top with search and the highlighted article, categories, one featured
// article in a dark band, the latest with filters, and the newsletter. What
// used to be separate sections (guides, videos, free resources, content
// types) are filters on the latest. Everything comes from the Studio's
// published articles; the numbers are counted, never written by hand.
export default function KnowledgeHomePage() {
  const [data, setData] = useState<HomeData>({ articles: [], hero: [], featured: [], categories: [], counts: {} })
  const [filter, setFilter] = useState<Filter>({ kind: 'all' })
  const [shown, setShown] = useState(PAGE)
  const signup = useNewsletterSignup('knowledge')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      knowledgeService.getLatestArticles(1000),
      knowledgeService.getFeaturedByPlacement('hero'),
      knowledgeService.getFeaturedByPlacement('featured-articles'),
      knowledgeService.getCategories(),
      knowledgeService.getArticleCountByCategory(),
    ]).then(([articles, hero, featured, categories, counts]) => {
      if (!cancelled) setData({ articles, hero, featured, categories, counts })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const names = useMemo(() => new Map(data.categories.map((c) => [c.slug, c.name])), [data.categories])
  const byCount = useMemo(
    () => data.categories.filter((c) => data.counts[c.slug]).sort((a, b) => (data.counts[b.slug] ?? 0) - (data.counts[a.slug] ?? 0)),
    [data.categories, data.counts],
  )
  // The top card: the Studio's "Main highlight on Knowledge", else the newest.
  const highlight = data.hero[0] ?? data.articles[0]
  // The dark band: a "Featured" article that isn't already the top card.
  const spotlight = data.featured.find((a) => a.slug !== highlight?.slug)

  const types = KNOWLEDGE_TYPES.filter((t) => t !== 'Article' && data.articles.some((a) => a.type === t))
  const filterCategories = byCount.slice(0, 3)
  const list = data.articles.filter((a) =>
    filter.kind === 'all' ? true : filter.kind === 'type' ? a.type === filter.type : a.categorySlug === filter.slug,
  )
  const same = (f: Filter) =>
    f.kind === filter.kind &&
    (f.kind === 'all' || (f.kind === 'type' && filter.kind === 'type' && f.type === filter.type) || (f.kind === 'category' && filter.kind === 'category' && f.slug === filter.slug))
  const chip = (f: Filter, label: string) => (
    <button
      key={label}
      type="button"
      onClick={() => {
        setFilter(f)
        setShown(PAGE)
      }}
      className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
        same(f) ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="pb-24">
      <SEO
        title={seoPage('/knowledge').title}
        description={seoPage('/knowledge').description}
        keywords={['business education', 'free business resources', 'business guides']}
        path="/knowledge"
      />

      <KnowledgeHero highlight={highlight} popular={byCount.slice(0, 4)} articleCount={data.articles.length} categoryCount={byCount.length} />

      {byCount.length > 0 && (
        <section id="browse-categories" className="container-px mx-auto max-w-7xl scroll-mt-28 pt-16 md:pt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow w-fit">Topics</p>
              <h2 className="mt-3 font-display text-[26px] font-bold text-navy sm:text-[30px]">Browse by category</h2>
            </div>
            <Link to="/knowledge/search" className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary">
              Search everything <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {byCount.map((c) => (
              <KnowledgeCategoryCard key={c.slug} slug={c.slug} name={c.name} count={data.counts[c.slug] ?? 0} />
            ))}
          </div>
        </section>
      )}

      {spotlight && (
        <section className="container-px mx-auto max-w-7xl pt-16 md:pt-20">
          <KnowledgeSpotlight article={spotlight} categoryName={names.get(spotlight.categorySlug)} />
        </section>
      )}

      {data.articles.length > 0 && (
        <section className="container-px mx-auto max-w-7xl pt-16 md:pt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow w-fit">Fresh</p>
              <h2 className="mt-3 font-display text-[26px] font-bold text-navy sm:text-[30px]">Latest articles &amp; guides</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {chip({ kind: 'all' }, 'All')}
              {types.map((t) => chip({ kind: 'type', type: t }, PLURAL[t]))}
              {filterCategories.map((c) => chip({ kind: 'category', slug: c.slug }, c.name))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.slice(0, shown).map((a) => (
              <KnowledgeCoverCard key={a.id} article={a} categoryName={names.get(a.categorySlug)} />
            ))}
          </div>
          {list.length > shown && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE)}
                className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-6 py-3 text-[14px] font-semibold text-navy shadow-softer transition-colors hover:border-primary/25 hover:text-primary"
              >
                <Plus size={15} /> Load more
              </button>
            </div>
          )}
        </section>
      )}

      <section className="container-px mx-auto max-w-7xl pt-16 md:pt-20">
        <div className="relative overflow-hidden rounded-[28px] bg-grad-primary px-6 py-12 text-center text-white shadow-glow sm:px-10 md:py-14">
          <p className="mx-auto w-fit rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">Free newsletter</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-[26px] font-bold leading-tight sm:text-[32px]">
            Get new guides and business strategies first
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-white/80">New articles, guides and free resources as they publish.</p>
          <form onSubmit={signup.submit} className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row">
            <input
              type="email"
              required
              value={signup.email}
              onChange={(e) => signup.setEmail(e.target.value)}
              aria-label="E-mail address"
              placeholder="you@business.com"
              className="w-full rounded-xl border-0 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/35 focus:outline-none"
            />
            <button type="submit" className="shrink-0 rounded-xl bg-navy px-5 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
              {signup.state === 'sending' ? 'Sending…' : signup.done ? 'Subscribed' : 'Subscribe free'}
            </button>
          </form>
          <p role="status" className="mt-3 text-[12.5px] text-white/70">
            {signup.message ?? 'No spam. Unsubscribe anytime with one click.'}
          </p>
          {signup.token && (
            <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-white p-5 text-left text-navy">
              <SignupInterests token={signup.token} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
