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

// The "Knowledge Cloud" — dozens-suggesting, never-readable interface
// fragments floating behind the Hero content. Each is purely abstract
// (placeholder bars/dots, no real copy) so nothing here ever needs to stay
// in sync with real product content. Data-driven so the cloud can be as
// dense as it needs to be without a wall of near-identical JSX blocks.
type FragmentKind = 'checklist' | 'dashboard' | 'progress' | 'grid' | 'lines' | 'chart' | 'card'

function CloudFragmentInner({ kind }: { kind: FragmentKind }) {
  switch (kind) {
    case 'checklist':
      return (
        <div className="space-y-2 rounded-xl bg-bg-soft/70 p-3">
          <div className="h-1.5 w-10 rounded-full bg-primary/20" />
          <div className="h-10 rounded-lg bg-white/70" />
          <div className="h-1.5 w-2/3 rounded-full bg-navy/[0.06]" />
        </div>
      )
    case 'dashboard':
      return (
        <div className="space-y-1.5 rounded-lg bg-bg-soft/70 p-2.5">
          <div className="mx-auto h-1 w-8 rounded-full bg-navy/10" />
          <div className="h-8 rounded-lg bg-grad-primary opacity-60" />
          <div className="h-1.5 w-1/2 rounded-full bg-navy/[0.06]" />
        </div>
      )
    case 'progress':
      return (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 rounded-full bg-grad-primary opacity-60" />
          <div className="flex-1 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-navy/[0.07]" />
            <div className="h-1.5 w-2/3 rounded-full bg-primary/20" />
          </div>
        </div>
      )
    case 'grid':
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-3 w-3 rounded-md bg-bg-soft/80" />
          ))}
        </div>
      )
    case 'lines':
      return (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-navy/[0.06]" />
          <div className="h-1.5 w-5/6 rounded-full bg-navy/[0.06]" />
          <div className="h-1.5 w-2/3 rounded-full bg-navy/[0.06]" />
        </div>
      )
    case 'chart':
      return (
        <div className="flex h-9 items-end gap-1.5">
          <div className="h-4 w-2 rounded bg-primary/30" />
          <div className="h-7 w-2 rounded bg-primary/40" />
          <div className="h-5 w-2 rounded bg-primary/25" />
          <div className="h-9 w-2 rounded bg-primary/50" />
        </div>
      )
    case 'card':
    default:
      return <div className="h-6 w-full rounded-lg bg-bg-soft/70" />
  }
}

interface CloudFragment {
  kind: FragmentKind
  // Complete, literal Tailwind classes (position, size, rotation, blur,
  // and the responsive "hidden …:block" visibility) — kept as one literal
  // string per entry (not composed at runtime) so Tailwind's build-time
  // class scanner can see every token.
  position: string
  opacity: string
  floatDelay: number
  floatDuration: number
  fadeDelay: number
}

const CLOUD: CloudFragment[] = [
  // Left flank, top to bottom — nearer/larger fragments show from `lg`,
  // deeper/smaller ones only reveal from `xl` for extra density on big screens.
  { kind: 'checklist', position: 'hidden -left-16 top-[12%] w-56 rotate-[-6deg] blur-[2px] lg:block', opacity: 'opacity-20', floatDelay: 0.3, floatDuration: 5, fadeDelay: 0.3 },
  { kind: 'lines', position: 'hidden -left-6 top-[28%] w-36 rotate-[2deg] blur-[2px] xl:block', opacity: 'opacity-10', floatDelay: 0.2, floatDuration: 6.2, fadeDelay: 0.5 },
  { kind: 'progress', position: '-left-16 top-[44%] w-36 rotate-[4deg] blur-[3px] lg:-left-24 lg:w-52', opacity: 'opacity-5 lg:opacity-15', floatDelay: 0.2, floatDuration: 6, fadeDelay: 0.6 },
  { kind: 'card', position: 'hidden -left-4 top-[58%] w-24 rotate-[-3deg] blur-[2px] xl:block', opacity: 'opacity-10', floatDelay: 0.6, floatDuration: 5.6, fadeDelay: 0.8 },
  { kind: 'lines', position: 'hidden -left-28 top-[70%] w-40 rotate-[-3deg] blur-[3px] xl:block', opacity: 'opacity-10', floatDelay: 0.1, floatDuration: 7, fadeDelay: 0.9 },
  { kind: 'grid', position: 'hidden -left-10 top-[84%] w-32 rotate-[3deg] blur-[2px] lg:block', opacity: 'opacity-10', floatDelay: 0.4, floatDuration: 5.8, fadeDelay: 1.1 },
  // Right flank, top to bottom
  { kind: 'dashboard', position: 'hidden -right-10 top-[16%] w-48 rotate-[5deg] blur-[2px] lg:block', opacity: 'opacity-15', floatDelay: 0.6, floatDuration: 5.4, fadeDelay: 0.45 },
  { kind: 'card', position: 'hidden -right-4 top-[32%] w-24 rotate-[4deg] blur-[2px] xl:block', opacity: 'opacity-10', floatDelay: 0.3, floatDuration: 6.4, fadeDelay: 0.65 },
  { kind: 'grid', position: '-right-12 top-[46%] w-28 rotate-[-4deg] blur-[3px] lg:-right-20 lg:w-40', opacity: 'opacity-5 lg:opacity-15', floatDelay: 0.5, floatDuration: 5.5, fadeDelay: 0.75 },
  { kind: 'chart', position: 'hidden -right-28 top-[60%] w-36 rotate-[3deg] blur-[3px] xl:block', opacity: 'opacity-10', floatDelay: 0.4, floatDuration: 6.5, fadeDelay: 1.05 },
  { kind: 'lines', position: 'hidden -right-6 top-[74%] w-32 rotate-[-2deg] blur-[2px] xl:block', opacity: 'opacity-10', floatDelay: 0.2, floatDuration: 6.8, fadeDelay: 1.2 },
  { kind: 'progress', position: 'hidden -right-16 top-[87%] w-44 rotate-[-5deg] blur-[3px] lg:block', opacity: 'opacity-10', floatDelay: 0.5, floatDuration: 6.1, fadeDelay: 1.3 },
]

export default function Hero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [exampleIndex, setExampleIndex] = useState(0)
  const goalsRowRef = useWheelHorizontalScroll<HTMLDivElement>()
  const sectionRef = useRef<HTMLElement>(null)

  // Very soft parallax for the Knowledge Cloud as the user scrolls past the
  // Hero — an extremely small translation, layered on top of (not
  // replacing) each fragment's own existing float animation.
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
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden pb-8 pt-24 sm:pb-10 sm:pt-28 md:pb-14 md:pt-32 lg:pb-16 lg:pt-36"
    >
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(47,128,255,0.18), rgba(255,255,255,0) 70%)' }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.38, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Knowledge Cloud — a dozen abstract, unreadable interface fragments
          (checklists, dashboards, progress trackers, grids, documents,
          charts) suggesting BGrowth is a whole ecosystem of tools, not one
          product. Kept clear of the central content column; desktop-only
          (lg/xl) so mobile stays uncluttered. One scroll-linked parallax
          layer wraps the whole cloud, on top of each fragment's own float loop. */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ y: bgParallaxY }}>
        {CLOUD.map((fragment, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: floatY.animate.y }}
            transition={{
              opacity: { duration: 1.2, delay: fragment.fadeDelay },
              y: { duration: fragment.floatDuration, repeat: Infinity, ease: 'easeInOut', delay: fragment.floatDelay },
            }}
            className={`absolute ${fragment.position}`}
          >
            <div className={`rounded-2xl border border-navy/[0.05] bg-white/40 p-3 ${fragment.opacity} shadow-softer backdrop-blur-lg`}>
              <CloudFragmentInner kind={fragment.kind} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="container-px relative mx-auto max-w-4xl text-center">
        <motion.h1
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="show"
          className="font-display text-[32px] font-bold leading-[1.22] tracking-tight text-navy sm:text-[58px] sm:leading-[1.15] md:text-[68px] lg:text-[80px]"
        >
          What do you want
          <br className="hidden sm:block" /> to achieve{' '}
          <span className="bg-grad-primary bg-clip-text text-transparent">next?</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mx-auto mt-4 max-w-[280px] text-[15px] leading-relaxed text-navy/55 sm:mt-5 sm:max-w-md sm:text-[18px]"
        >
          Discover the right solutions, knowledge and guidance to move forward, one goal at a
          time.
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="mt-4 flex h-7 items-center justify-center text-[14px] text-navy/50 sm:mt-5 sm:text-[16px]"
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
          className="mx-auto mt-6 max-w-[760px] px-3 sm:mt-7 sm:px-0"
        >
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search your next goal…"
            size="lg"
            className="hover:shadow-glow focus-within:shadow-glow"
          />
        </motion.form>

        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show" className="mt-5 sm:mt-6">
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
          className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2.5 sm:mt-7 sm:max-w-none sm:gap-3"
        >
          <Button
            href="#life-worlds"
            className="!h-12 !flex-1 !gap-1 !whitespace-nowrap !rounded-full !px-3 !text-[12.5px] sm:!h-14 sm:!flex-none sm:!gap-2 sm:!px-8 sm:!text-sm"
            icon={<ArrowRight size={16} className="hidden sm:inline" />}
          >
            Find My Solution
          </Button>
          <Button
            href="#knowledge"
            variant="secondary"
            className="!h-12 !flex-1 !whitespace-nowrap !rounded-full !px-3 !text-[12.5px] sm:!h-14 sm:!flex-none sm:!px-8 sm:!text-sm"
          >
            Browse Knowledge
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
