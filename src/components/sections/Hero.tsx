import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SearchBar from '../ui/SearchBar'
import Button from '../ui/Button'
import { fadeUp, floatY } from '../../lib/motion'

// Rotating examples for the "I want to ___" line beneath the headline —
// purely presentational copy, not tied to any Growth Category data model.
const EXAMPLES = [
  'become a Mobile Notary.',
  'start a cleaning business.',
  'improve my finances.',
  'build better habits.',
  'learn English.',
  'lose weight.',
]

// Popular goals — a single horizontal scrolling row (see useWheelHorizontalScroll
// below), never wraps to a second row. Clicking one populates the search field.
const POPULAR_GOALS = [
  'Become a Mobile Notary',
  'Start a Cleaning Business',
  'Improve My Finances',
  'Build Better Habits',
  'Learn English',
  'Lose Weight',
  'Become a Tax Preparer',
  'Start a Pressure Washing Business',
]

const ROTATE_MS = 2800

// Lets a vertical mouse-wheel gesture drive the horizontal goals row (the
// "Netflix row" pattern) while leaving genuine horizontal trackpad/touch
// gestures — which already arrive with their own deltaX — untouched.
function useWheelHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return ref
}

export default function Hero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [exampleIndex, setExampleIndex] = useState(0)
  const goalsRowRef = useWheelHorizontalScroll<HTMLDivElement>()
  const sectionRef = useRef<HTMLElement>(null)

  // Very soft parallax for the background "ecosystem" panels as the user
  // scrolls past the Hero — an extremely small translation, layered on top
  // of (not replacing) each panel's own existing float animation.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const bgParallaxY = useTransform(scrollYProgress, [0, 1], [0, 36])

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
    <section ref={sectionRef} className="relative isolate overflow-hidden pb-14 pt-32 md:pb-16 md:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(47,128,255,0.18), rgba(255,255,255,0) 70%)' }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.38, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient "ecosystem" background — abstract, low-opacity, blurred
          interface panels (dashboard, checklist, calculator, progress,
          knowledge, chart) suggesting a platform full of connected tools
          without ever becoming readable or product-specific. Kept behind
          and clear of the central content column; never competes with the
          headline. Wrapped in one scroll-linked parallax layer (very small
          translation) on top of each panel's own existing float loop. */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ y: bgParallaxY }}>
        {/* Checklist panel — top-left */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...floatY.animate }}
          transition={{ opacity: { duration: 1.2, delay: 0.3 }, y: { ...floatY.transition, delay: 0.3 } }}
          className="absolute -left-16 top-1/3 hidden w-56 rotate-[-6deg] blur-[2px] lg:block"
        >
          <div className="rounded-2xl border border-navy/[0.05] bg-white/40 p-3 opacity-20 shadow-softer backdrop-blur-lg">
            <div className="space-y-2 rounded-xl bg-bg-soft/70 p-3">
              <div className="h-1.5 w-10 rounded-full bg-primary/20" />
              <div className="h-10 rounded-lg bg-white/70" />
              <div className="h-1.5 w-2/3 rounded-full bg-navy/[0.06]" />
            </div>
          </div>
        </motion.div>

        {/* Mini dashboard panel — top-right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...floatY.animate }}
          transition={{ opacity: { duration: 1.2, delay: 0.45 }, y: { ...floatY.transition, delay: 0.6 } }}
          className="absolute -right-10 top-1/4 hidden w-48 rotate-[5deg] blur-[2px] lg:block"
        >
          <div className="rounded-2xl border border-navy/[0.05] bg-white/40 p-2.5 opacity-15 shadow-softer backdrop-blur-lg">
            <div className="space-y-1.5 rounded-lg bg-bg-soft/70 p-2.5">
              <div className="mx-auto h-1 w-8 rounded-full bg-navy/10" />
              <div className="h-8 rounded-lg bg-grad-primary opacity-60" />
              <div className="h-1.5 w-1/2 rounded-full bg-navy/[0.06]" />
            </div>
          </div>
        </motion.div>

        {/* Progress tracker panel — bottom-left, deeper/softer layer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...floatY.animate }}
          transition={{ opacity: { duration: 1.2, delay: 0.6 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 } }}
          className="absolute -left-24 bottom-16 hidden w-52 rotate-[4deg] blur-[3px] lg:block"
        >
          <div className="rounded-2xl border border-navy/[0.05] bg-white/40 p-3 opacity-15 shadow-softer backdrop-blur-lg">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 shrink-0 rounded-full bg-grad-primary opacity-60" />
              <div className="flex-1 space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-navy/[0.07]" />
                <div className="h-1.5 w-2/3 rounded-full bg-primary/20" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Calculator / grid panel — bottom-right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...floatY.animate }}
          transition={{ opacity: { duration: 1.2, delay: 0.75 }, y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }}
          className="absolute -right-20 bottom-20 hidden w-40 rotate-[-4deg] blur-[3px] lg:block"
        >
          <div className="rounded-2xl border border-navy/[0.05] bg-white/40 p-3 opacity-15 shadow-softer backdrop-blur-lg">
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-3 w-3 rounded-md bg-bg-soft/80" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Knowledge / document panel — far left, deepest layer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...floatY.animate }}
          transition={{ opacity: { duration: 1.2, delay: 0.9 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.1 } }}
          className="absolute -left-28 top-[58%] hidden w-40 rotate-[-3deg] blur-[3px] xl:block"
        >
          <div className="rounded-2xl border border-navy/[0.05] bg-white/40 p-3 opacity-10 shadow-softer backdrop-blur-lg">
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-navy/[0.06]" />
              <div className="h-1.5 w-5/6 rounded-full bg-navy/[0.06]" />
              <div className="h-1.5 w-2/3 rounded-full bg-navy/[0.06]" />
            </div>
          </div>
        </motion.div>

        {/* Chart / graph panel — far right, deepest layer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...floatY.animate }}
          transition={{ opacity: { duration: 1.2, delay: 1.05 }, y: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
          className="absolute -right-28 top-[62%] hidden w-36 rotate-[3deg] blur-[3px] xl:block"
        >
          <div className="rounded-2xl border border-navy/[0.05] bg-white/40 p-3 opacity-10 shadow-softer backdrop-blur-lg">
            <div className="flex h-9 items-end gap-1.5">
              <div className="h-4 w-2 rounded bg-primary/30" />
              <div className="h-7 w-2 rounded bg-primary/40" />
              <div className="h-5 w-2 rounded bg-primary/25" />
              <div className="h-9 w-2 rounded bg-primary/50" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="container-px relative mx-auto max-w-4xl text-center">
        <motion.h1
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="show"
          className="font-display text-[34px] font-bold leading-[1.15] tracking-tight text-navy sm:text-[58px] md:text-[68px] lg:text-[80px]"
        >
          What do you want
          <br />
          to achieve <span className="bg-grad-primary bg-clip-text text-transparent">next?</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-navy/55 sm:text-[18px]"
        >
          Discover the right solutions, knowledge and guidance to move forward, one goal at a
          time.
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="mt-5 flex h-7 items-center justify-center text-[15px] text-navy/50 sm:text-[16px]"
        >
          <span className="mr-1.5">I want to</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={exampleIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="font-semibold text-navy"
            >
              {EXAMPLES[exampleIndex]}
            </motion.span>
          </AnimatePresence>
          <span className="ml-0.5 h-[1em] w-[1.5px] animate-pulse bg-primary/60" aria-hidden />
        </motion.div>

        <motion.form
          onSubmit={handleSearch}
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="mx-auto mt-7 max-w-[760px]"
        >
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search your next goal…"
            size="lg"
            className="hover:shadow-glow focus-within:shadow-glow"
          />
        </motion.form>

        <motion.div
          variants={fadeUp}
          custom={4}
          initial="hidden"
          animate="show"
          className="mt-6"
        >
          <div
            ref={goalsRowRef}
            className="no-scrollbar flex snap-x snap-proximity gap-2.5 overflow-x-auto scroll-smooth px-6 [scroll-padding-inline:1.5rem]"
          >
            {POPULAR_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setQuery(goal)}
                className="shrink-0 snap-start whitespace-nowrap rounded-full border border-navy/10 bg-white px-5 py-2.5 text-[13.5px] font-medium text-navy/60 shadow-softer transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:text-navy hover:shadow-soft"
              >
                {goal}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={5}
          initial="hidden"
          animate="show"
          className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            href="#life-worlds"
            className="!h-14 !rounded-full !px-8"
            icon={<ArrowRight size={16} />}
          >
            Find My Solution
          </Button>
          <Button href="#knowledge" variant="secondary" className="!h-14 !rounded-full !px-8">
            Browse Knowledge
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
