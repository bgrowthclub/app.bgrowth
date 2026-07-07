import { motion } from 'framer-motion'
import { Sparkles, PlayCircle, Rocket, ClipboardList, LayoutTemplate, Library, TrendingUp } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Rocket, label: 'Start Your Business' },
  { icon: ClipboardList, label: 'Daily Operations' },
  { icon: LayoutTemplate, label: 'Templates' },
  { icon: Library, label: 'Resources' },
  { icon: TrendingUp, label: 'Progress' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' },
  }),
}

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
            className="mt-6 font-display text-[42px] font-bold leading-[1.08] tracking-tight text-navy sm:text-[54px] lg:text-[60px]"
          >
            Business Systems
            <br />
            That Help You
            <br />
            <span className="bg-grad-primary bg-clip-text text-transparent">Grow Anywhere.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-md text-[17px] leading-relaxed text-navy/60"
          >
            Professional digital systems designed to help you launch, organize, and grow your business with confidence.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a href="#systems" className="btn-primary">
              Browse Systems
            </a>
            <a href="#demo" className="btn-secondary">
              <PlayCircle size={17} />
              Watch Demo
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            initial="hidden"
            animate="show"
            className="mt-12 flex items-center gap-6 text-xs text-navy/40"
          >
            <span>Trusted by service business owners across 12+ industries</span>
          </motion.div>
        </div>

        {/* Right column — signature interactive mockup */}
        <div className="relative z-10 h-[440px] sm:h-[480px] lg:h-[520px]">
          {/* Laptop / desktop frame */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="absolute inset-x-0 top-0 mx-auto w-full max-w-[520px] rounded-xl3 border border-navy/[0.06] bg-white p-2 shadow-glow"
            style={{ perspective: 1200 }}
          >
            <div className="flex items-center gap-1.5 px-3 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-0 overflow-hidden rounded-xl2 border border-navy/[0.05] bg-bg-soft">
              {/* sidebar */}
              <div className="flex flex-col gap-1 border-r border-navy/[0.05] bg-white/70 p-2.5">
                {NAV_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] font-medium ${
                      i === 0
                        ? 'bg-grad-primary text-white shadow-softer'
                        : 'text-navy/50'
                    }`}
                  >
                    <item.icon size={12} strokeWidth={2.3} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </motion.div>
                ))}
              </div>
              {/* content */}
              <div className="space-y-2.5 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-24 rounded-full bg-navy/10" />
                  <div className="h-5 w-14 rounded-md bg-primary/10" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[62, 40, 85].map((v, i) => (
                    <div key={i} className="rounded-lg border border-navy/[0.05] bg-white p-2.5 shadow-softer">
                      <div className="h-1.5 w-8 rounded-full bg-navy/10" />
                      <div className="mt-2 h-1.5 w-full rounded-full bg-navy/[0.06]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${v}%` }}
                          transition={{ delay: 1 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                          className="h-1.5 rounded-full bg-grad-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-navy/[0.05] bg-white p-3 shadow-softer">
                  <div className="h-1.5 w-16 rounded-full bg-navy/10" />
                  <div className="mt-2 space-y-1.5">
                    {[1, 2, 3].map((r) => (
                      <div key={r} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-md border border-primary/30 bg-primary/5" />
                        <div className="h-1.5 flex-1 rounded-full bg-navy/[0.06]" />
                      </div>
                    ))}
                  </div>
                </div>
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
