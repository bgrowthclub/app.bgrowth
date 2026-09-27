import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SearchBar from '../ui/SearchBar'
import Button from '../ui/Button'
import { fadeUp, floatY } from '../../lib/motion'

const SUGGESTED_TOPICS = [
  'Start a Business',
  'Cleaning Business',
  'Mobile Notary',
  'Bookkeeping',
  'Taxes',
  'Marketing',
  'Personal Finance',
  'Business Planning',
]

// The Knowledge Home's hero — its own component (not a reuse of
// sections/Hero.tsx, which is homepage-only per CLAUDE.md §6) so the
// Homepage itself is never touched by anything Knowledge-specific.
// Decorative-only: soft gradient blobs and floating brand-gradient shapes,
// no stock photography, matching the Homepage Hero's visual language at a
// smaller scale appropriate for an inner page.
export default function KnowledgeHero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function goToSearch(q: string) {
    const trimmed = q.trim()
    navigate(trimmed ? `/knowledge/search?q=${encodeURIComponent(trimmed)}` : '/knowledge/search')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    goToSearch(query)
  }

  return (
    <section className="relative isolate overflow-hidden pb-14 pt-32 md:pb-20 md:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(47,128,255,0.18), rgba(255,255,255,0) 70%)' }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.25, 0.32, 0.25] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-16 hidden h-24 w-24 rounded-3xl bg-grad-primary opacity-10 blur-md lg:block"
        animate={{ y: floatY.animate.y }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-10 top-40 hidden h-16 w-16 rounded-2xl bg-grad-primary opacity-10 blur-md lg:block"
        animate={{ y: floatY.animate.y }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />

      <div className="container-px relative mx-auto max-w-4xl text-center">
        <motion.p variants={fadeUp} custom={0} initial="hidden" animate="show" className="eyebrow mx-auto w-fit">
          BGrowth Knowledge™
        </motion.p>

        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mt-4 font-display text-[32px] font-bold leading-[1.2] tracking-tight text-navy sm:text-[48px] sm:leading-[1.15] md:text-[58px]"
        >
          What do you want to{' '}
          <span className="bg-grad-primary bg-clip-text text-transparent">learn</span> next?
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-navy/55 sm:text-[17px]"
        >
          Practical business education, free resources, and expert guidance — everything BGrowth
          publishes to help you move forward, in one place.
        </motion.p>

        <motion.form
          onSubmit={handleSearch}
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="mx-auto mt-8 max-w-[640px] px-3 sm:px-0"
        >
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search articles, guides, checklists, calculators…"
            size="lg"
            className="hover:shadow-glow focus-within:shadow-glow"
          />
        </motion.form>

        <motion.div
          variants={fadeUp}
          custom={4}
          initial="hidden"
          animate="show"
          className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3 sm:max-w-none"
        >
          <Button onClick={() => goToSearch(query)} className="!px-7">
            Start Learning
          </Button>
          <Button href="#browse-categories" variant="secondary" className="!px-7">
            Browse Categories
          </Button>
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={5}
          initial="hidden"
          animate="show"
          className="mt-7 flex flex-wrap items-center justify-center gap-2"
        >
          {SUGGESTED_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => goToSearch(topic)}
              className="rounded-full border border-navy/10 bg-white px-4 py-2 text-[12.5px] font-medium text-navy/60 shadow-softer transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:text-navy hover:shadow-soft"
            >
              {topic}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
