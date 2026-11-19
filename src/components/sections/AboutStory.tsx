import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

// "Why BGrowth exists" — since 19/11/2026 (the owner's design) a white card
// with the label as a pill, the first paragraph as a large quote, and two
// buttons: the story and the catalog.
export default function AboutStory() {
  const t = usePageTexts()
  return (
    <section id="about" className="section-py relative bg-bg-soft">
      <div className="container-px mx-auto max-w-4xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="rounded-[28px] border border-navy/[0.06] bg-white px-6 py-12 text-center shadow-soft sm:px-14 sm:py-16"
        >
          <p className="mx-auto w-fit rounded-full border border-primary/15 bg-bg-soft px-3.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary">
            {t.text('home.story.eyebrow')}
          </p>
          <p className="mt-6 font-display text-[24px] font-bold leading-snug tracking-tight text-navy sm:text-[32px]">
            “{t.text('home.story.lead')}”
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-[15.5px] leading-relaxed text-navy/60">{t.text('home.story.body')}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/about" className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-[14.5px] font-semibold text-white transition-opacity hover:opacity-90">
              {t.text('home.story.button')} <ArrowRight size={16} aria-hidden />
            </Link>
            <Link to="/systems" className="inline-flex items-center rounded-xl bg-bg-soft px-5 py-3 text-[14.5px] font-semibold text-navy transition-colors hover:bg-navy/[0.06]">
              {t.text('home.story.secondary')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
