import { motion } from 'framer-motion'
import { Sparkles, CheckSquare, Square } from 'lucide-react'
import Button from '../ui/Button'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' },
  }),
}

const LAUNCH_STEPS = [
  { label: 'Business entity registered', done: true },
  { label: 'Pricing & service area defined', done: true },
  { label: 'Booking page published', done: false },
  { label: 'First job completed', done: false },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-24 md:pt-52 md:pb-32">
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(47,128,255,0.18), rgba(255,255,255,0) 70%)' }}
      />

      <div className="container-px relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
        {/* Left column */}
        <div className="relative z-10">
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="badge">
            <Sparkles size={14} strokeWidth={2.5} />
            BUSINESS SYSTEMS™
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-[38px] font-bold leading-[1.12] tracking-tight text-navy sm:text-[48px] lg:text-[52px]"
          >
            Business Systems
            <br />
            Built for Service
            <br />
            <span className="bg-grad-primary bg-clip-text text-transparent">Professionals.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-md text-[17px] leading-relaxed text-navy/60"
          >
            Launch faster. Operate smarter. Grow with confidence.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/systems">Browse Systems</Button>
            <Button variant="secondary" href="#how-it-works">
              How It Works
            </Button>
          </motion.div>
        </div>

        {/* Right column — interactive business-system preview (not a dashboard) */}
        <div className="relative z-10 h-[420px] sm:h-[460px] lg:h-[500px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="absolute inset-x-0 top-0 mx-auto w-full max-w-[480px] rounded-xl3 border border-navy/[0.06] bg-white p-2 shadow-glow"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
              </div>
              <span className="text-[11px] font-semibold text-navy/30">Start Your Notary Business™</span>
            </div>
            <div className="rounded-xl2 border border-navy/[0.05] bg-bg-soft p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                Launch Planner™
              </p>
              <div className="mt-4 space-y-2.5">
                {LAUNCH_STEPS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-2.5 rounded-lg bg-white px-3.5 py-3 shadow-softer"
                  >
                    {item.done ? (
                      <CheckSquare size={16} className="shrink-0 text-primary" />
                    ) : (
                      <Square size={16} className="shrink-0 text-navy/20" />
                    )}
                    <span className={`text-[13px] ${item.done ? 'text-navy/35 line-through' : 'text-navy/75'}`}>
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-white px-3.5 py-3 shadow-softer">
                <p className="text-[11px] font-medium text-navy/40">Target launch date</p>
                <div className="mt-1.5 h-2 w-28 rounded-full bg-navy/[0.08]" />
              </div>
            </div>
          </motion.div>

          {/* Tablet floating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="absolute -bottom-2 left-0 w-[150px]"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-2xl border border-navy/[0.06] bg-white p-2 shadow-glow"
            >
              <div className="space-y-2 rounded-xl bg-bg-soft p-3">
                <div className="h-2 w-14 rounded-full bg-primary/20" />
                <div className="h-14 rounded-lg bg-white shadow-softer" />
                <div className="h-1.5 w-3/4 rounded-full bg-navy/[0.08]" />
              </div>
            </motion.div>
          </motion.div>

          {/* Phone floating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="absolute -bottom-4 right-0 w-[92px]"
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              className="rounded-[22px] border border-navy/[0.06] bg-white p-1.5 shadow-glow"
            >
              <div className="space-y-1.5 rounded-[16px] bg-bg-soft p-2.5">
                <div className="mx-auto h-1 w-6 rounded-full bg-navy/15" />
                <div className="h-10 rounded-lg bg-grad-primary opacity-90" />
                <div className="h-1.5 w-2/3 rounded-full bg-navy/[0.08]" />
                <div className="h-1.5 w-1/2 rounded-full bg-navy/[0.08]" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
