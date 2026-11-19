import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Clock, Layers, Search, Sparkles, TrendingUp } from 'lucide-react'
import { fadeUp } from '../../lib/motion'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import type { KnowledgeCategory } from '../../modules/knowledge/types/category'

interface Props {
  /** The article in the card beside the search ("Main highlight on Knowledge" in the Studio, else the newest). */
  highlight?: KnowledgeArticleIndexEntry
  /** Categories with the most articles — the "Popular" chips. */
  popular: KnowledgeCategory[]
  articleCount: number
  categoryCount: number
}

// The Knowledge hub's top (19/11/2026, the owner's design): words, search and
// popular topics on the left, the highlighted article on the right. Every
// number on it is counted from what is published — nothing invented.
export default function KnowledgeHero({ highlight, popular, articleCount, categoryCount }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function search(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/knowledge/search?q=${encodeURIComponent(q)}` : '/knowledge/search')
  }

  return (
    <section className="relative isolate overflow-hidden border-b border-navy/[0.06] bg-grad-radial-soft pb-16 pt-28 md:pb-20 md:pt-36">
      <div className="container-px mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.p variants={fadeUp} custom={0} initial="hidden" animate="show" className="eyebrow w-fit">
            <Sparkles size={13} className="mr-1.5 inline" /> BGrowth Knowledge™
          </motion.p>
          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-5 font-display text-[34px] font-bold leading-[1.12] tracking-tight text-navy sm:text-[48px] md:text-[56px]"
          >
            What do you want to <span className="bg-grad-primary bg-clip-text text-transparent">learn today?</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show" className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-navy/60 sm:text-[17px]">
            Practical business education — step-by-step guides, free resources and expert articles to help you start, run and grow.
          </motion.p>

          <motion.form
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            onSubmit={search}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-navy/[0.08] bg-white p-2 shadow-soft focus-within:shadow-glow"
          >
            <Search size={18} className="ml-3 shrink-0 text-navy/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search Knowledge"
              placeholder="Search articles, guides, notary, taxes…"
              className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[15px] text-navy placeholder:text-navy/35 focus:outline-none"
            />
            <button type="submit" className="btn-primary shrink-0 !px-5 !py-2.5 text-[14px]">
              <span className="hidden sm:inline">Search</span> <ArrowRight size={15} />
            </button>
          </motion.form>

          {popular.length > 0 && (
            <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show" className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-navy/45">
                <TrendingUp size={13} /> Popular:
              </span>
              {popular.map((c) => (
                <Link
                  key={c.slug}
                  to={`/knowledge/category/${c.slug}`}
                  className="rounded-full border border-navy/10 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-navy/70 transition-colors hover:border-primary/25 hover:text-primary"
                >
                  {c.name}
                </Link>
              ))}
            </motion.div>
          )}

          {articleCount > 0 && (
            <motion.p variants={fadeUp} custom={5} initial="hidden" animate="show" className="mt-7 flex flex-wrap gap-5 text-[13px] text-navy/50">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" /> <strong className="text-navy">{articleCount}</strong> articles &amp; guides
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers size={14} className="text-primary" /> <strong className="text-navy">{categoryCount}</strong> topics
              </span>
            </motion.p>
          )}
        </div>

        {highlight && (
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show">
            <Link
              to={`/knowledge/article/${highlight.slug}`}
              className="group block overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white p-3 shadow-glow transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-navy">
                {highlight.coverImage ? (
                  <img src={highlight.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="h-full w-full bg-grad-primary" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">Featured</span>
                  <h2 className="mt-3 font-display text-[19px] font-bold leading-snug text-white sm:text-[21px]">{highlight.title}</h2>
                </div>
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-3.5 text-[13px]">
                <span className="inline-flex items-center gap-1.5 text-navy/50">
                  <Clock size={13} /> {highlight.readingTimeMinutes} min read
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  Read article <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
