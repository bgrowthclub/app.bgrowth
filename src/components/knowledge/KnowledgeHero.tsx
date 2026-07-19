import { motion } from 'framer-motion'
import { BookOpen, GraduationCap, Clock } from 'lucide-react'
import Button from '../ui/Button'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

const PREVIEW_CATEGORIES = ['Business', 'Finance', 'Career']

export default function KnowledgeHero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-20 md:pt-52 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />

      <div className="container-px relative mx-auto grid max-w-page items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="badge">
            <BookOpen size={14} strokeWidth={2.5} aria-hidden="true" />
            BGROWTH KNOWLEDGE™
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-[36px] font-bold leading-[1.14] tracking-tight text-navy sm:text-[44px] lg:text-[50px]"
          >
            Knowledge That
            <br />
            Moves You <span className="bg-grad-primary bg-clip-text text-transparent">Forward.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-md text-[17px] leading-relaxed text-navy/60"
          >
            Discover practical guides, business insights, career advice, and real strategies to help you learn,
            launch, work, manage and grow.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button href="#articles">Explore Articles</Button>
            <Button variant="secondary" href="#categories">
              Browse Categories
            </Button>
          </motion.div>
        </div>

        {/* Illustration — a static reading-preview composition, no looping motion */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="relative z-10 h-[380px] sm:h-[420px] lg:h-[440px]"
        >
          <div className="absolute inset-x-0 top-0 mx-auto w-full max-w-[440px] rounded-xl3 border border-navy/[0.06] bg-white p-2 shadow-glow">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
              </div>
              <span className="text-[11px] font-semibold text-navy/30">Knowledge Library</span>
            </div>

            <div className="rounded-xl2 border border-navy/[0.05] bg-bg-soft p-5">
              <span className="w-fit rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-primary shadow-softer">
                Business
              </span>
              <div className="mt-4 h-3 w-4/5 rounded-full bg-navy/[0.1]" />
              <div className="mt-2.5 space-y-2">
                <div className="h-2 w-full rounded-full bg-navy/[0.06]" />
                <div className="h-2 w-full rounded-full bg-navy/[0.06]" />
                <div className="h-2 w-2/3 rounded-full bg-navy/[0.06]" />
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-[11.5px] text-navy/35">
                <Clock size={12} aria-hidden="true" />7 min read
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5 px-3 pb-2">
              {PREVIEW_CATEGORIES.map((c) => (
                <span key={c} className="rounded-full bg-bg-soft px-3 py-1 text-[11px] font-medium text-navy/50">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Accent card — static, single entrance only */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute -bottom-4 -left-2 w-[170px] rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-glow sm:left-0"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-grad-primary text-white">
              <GraduationCap size={17} strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="mt-3 text-[12.5px] font-semibold leading-snug text-navy">280+ free resources</p>
            <p className="mt-0.5 text-[11px] text-navy/40">and growing every week</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
