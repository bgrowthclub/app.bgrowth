import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import WorkspaceCoverCard from '../systems/WorkspaceCoverCard'
import SectionHeader from '../ui/SectionHeader'
import Button from '../ui/Button'
import { loadFeaturedSystemProducts, systemForCard } from '../../lib/publishedCatalog'
import { fadeUp, viewportOnce } from '../../lib/motion'

// Lets a vertical mouse-wheel gesture drive the horizontal carousel — same
// pattern as the Hero's suggested-goals row (see components/sections/Hero.tsx).
function useWheelHorizontalScroll(ref: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // real horizontal gestures pass through natively
      // Only hijack the gesture while the row actually has somewhere to go —
      // otherwise a mouse sitting over this (full-width) row would trap the
      // page and block the visitor from ever scrolling past this section.
      const atStart = el.scrollLeft <= 0
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return
      el.scrollLeft += e.deltaY
      e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [ref])
}

// Click-and-drag scrolling for mouse users — touch/trackpad already get
// native momentum scrolling from `overflow-x-auto` and are left alone here
// (guarded by pointerType) so this never fights the browser's own handling.
function useDragScroll(ref: RefObject<HTMLDivElement>) {
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false }
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return
      const dx = e.clientX - drag.current.startX
      if (Math.abs(dx) > 4) drag.current.moved = true
      el.scrollLeft = drag.current.startScroll - dx
    }
    const onUp = () => {
      drag.current.active = false
    }
    // A real drag shouldn't also trigger the card's Link navigation.
    const onClickCapture = (e: MouseEvent) => {
      if (drag.current.moved) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('click', onClickCapture, true)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('click', onClickCapture, true)
    }
  }, [ref])
}

export default function StartHere() {
  // Reads the Runtime↔Product Engine connection's Published Product
  // Repository (via ProductService.getFeatured()) instead of a hardcoded
  // catalog filter — a product only shows up here once Studio has both
  // published it and marked it Featured. See lib/publishedCatalog.ts.
  const [workspaces, setWorkspaces] = useState<Awaited<ReturnType<typeof loadFeaturedSystemProducts>>>([])

  useEffect(() => {
    let cancelled = false
    loadFeaturedSystemProducts().then((pairs) => {
      if (!cancelled) setWorkspaces(pairs)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const trackRef = useRef<HTMLDivElement>(null)
  useWheelHorizontalScroll(trackRef)
  useDragScroll(trackRef)

  const scrollByCard = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' })
  }

  return (
    <section id="start-here" className="section-py relative">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader
          eyebrow="Start Here"
          title="Start with one goal."
          description="Explore some of the most popular BGrowth Workspaces designed to help you take action and achieve meaningful results."
          className="mb-10"
        />
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="container-px flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pt-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {workspaces.map((pair, i) => (
            <motion.div
              key={pair.product.id}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="w-[260px] shrink-0 sm:w-[300px] lg:w-[320px]"
            >
              <WorkspaceCoverCard system={systemForCard(pair)} index={i} />
            </motion.div>
          ))}
          {/* Trailing spacer so the last card can snap fully into view
              instead of stopping flush against the viewport edge. */}
          <div className="w-px shrink-0 sm:w-6" aria-hidden />
        </div>

        <div className="container-px mt-4 hidden justify-end gap-2 sm:flex">
          <button
            onClick={() => scrollByCard(-1)}
            aria-label="Scroll left"
            className="grid h-10 w-10 place-items-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-softer transition-colors hover:border-primary/20 hover:text-navy"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => scrollByCard(1)}
            aria-label="Scroll right"
            className="grid h-10 w-10 place-items-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-softer transition-colors hover:border-primary/20 hover:text-navy"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="container-px mx-auto mt-16 max-w-page">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto max-w-xl text-center"
        >
          <h3 className="font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Ready to explore more?
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-navy/55">
            Discover dozens of Workspaces designed to help you build businesses, develop skills,
            improve your finances, organize your life and much more.
          </p>
          <div className="mt-7 flex justify-center">
            <Button to="/systems" icon={<ArrowRight size={16} />}>
              Explore All Workspaces
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
