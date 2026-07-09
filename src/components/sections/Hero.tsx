import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SearchBar from '../ui/SearchBar'
import { fadeUp } from '../../lib/motion'

// Rotating examples for the "I want to ___" line beneath the headline —
// purely presentational copy, not tied to any Growth Category data model.
const EXAMPLES = [
  'become a Mobile Notary.',
  'start a cleaning business.',
  'build better habits.',
  'improve my finances.',
  'learn English.',
  'lose weight.',
]

// Suggestion chips below the search bar — clicking one just populates the
// search field, it doesn't submit. Intentionally a static list here rather
// than derived from the catalog: these represent goals across every future
// Growth Category, most of which have no real catalog data yet.
const SUGGESTIONS = [
  'I want to become a Mobile Notary',
  'I want to start a new habit',
  'I want to start a cleaning business',
  'I want to manage my finances',
  'I want to learn English',
]

const ROTATE_MS = 2800

export default function Hero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [exampleIndex, setExampleIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setExampleIndex((i) => (i + 1) % EXAMPLES.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/systems')
  }

  return (
    <section className="relative isolate overflow-hidden pb-24 pt-40 md:pb-32 md:pt-52">
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(47,128,255,0.18), rgba(255,255,255,0) 70%)' }}
      />

      {/* Ambient floating UI shapes — abstract, low-opacity, blurred; pure
          background texture communicating "this is a platform," not a
          second focal point. No product-specific content, since the Hero
          no longer speaks to any one Growth Category. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="pointer-events-none absolute -left-16 top-1/3 hidden w-56 rotate-[-6deg] blur-[1px] lg:block"
      >
        <div className="rounded-2xl border border-navy/[0.05] bg-white/50 p-3 opacity-30 shadow-softer backdrop-blur-md">
          <div className="space-y-2 rounded-xl bg-bg-soft/70 p-3">
            <div className="h-1.5 w-10 rounded-full bg-primary/20" />
            <div className="h-10 rounded-lg bg-white/70" />
            <div className="h-1.5 w-2/3 rounded-full bg-navy/[0.06]" />
          </div>
        </div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.45 }}
        className="pointer-events-none absolute -right-10 top-1/4 hidden w-48 rotate-[5deg] blur-[1px] lg:block"
      >
        <div className="rounded-2xl border border-navy/[0.05] bg-white/50 p-2.5 opacity-25 shadow-softer backdrop-blur-md">
          <div className="space-y-1.5 rounded-lg bg-bg-soft/70 p-2.5">
            <div className="mx-auto h-1 w-8 rounded-full bg-navy/10" />
            <div className="h-8 rounded-lg bg-grad-primary opacity-60" />
            <div className="h-1.5 w-1/2 rounded-full bg-navy/[0.06]" />
          </div>
        </div>
      </motion.div>

      <div className="container-px relative mx-auto max-w-3xl text-center">
        <motion.h1
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="show"
          className="font-display text-[38px] font-bold leading-[1.12] tracking-tight text-navy sm:text-[52px] lg:text-[60px]"
        >
          What do you want
          <br />
          to <span className="bg-grad-primary bg-clip-text text-transparent">achieve?</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mx-auto mt-6 max-w-md text-[16px] leading-relaxed text-navy/55 sm:text-[17px]"
        >
          Find the right tools, guidance and knowledge to help you achieve your goals with
          confidence.
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="mt-6 flex h-7 items-center justify-center text-[15px] text-navy/50 sm:text-[16px]"
        >
          <span className="mr-1.5">I want to</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={exampleIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="font-semibold text-navy"
            >
              {EXAMPLES[exampleIndex]}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.form
          onSubmit={handleSearch}
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="mx-auto mt-8 max-w-lg"
        >
          <SearchBar value={query} onChange={setQuery} placeholder="Search your next goal…" />
        </motion.form>

        <motion.div
          variants={fadeUp}
          custom={4}
          initial="hidden"
          animate="show"
          className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2"
        >
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="rounded-full border border-navy/10 bg-white px-4 py-2 text-[13px] font-medium text-navy/60 shadow-softer transition-all duration-300 hover:border-primary/20 hover:text-navy"
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
