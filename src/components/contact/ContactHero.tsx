import { motion } from 'framer-motion'
import { MessageSquare, CheckCircle2, Clock } from 'lucide-react'
import Button from '../ui/Button'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function ContactHero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-20 md:pt-52 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />

      <div className="container-px relative mx-auto grid max-w-page items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="badge">
            <MessageSquare size={14} strokeWidth={2.5} aria-hidden="true" />
            CONTACT
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-[36px] font-bold leading-[1.14] tracking-tight text-navy sm:text-[44px] lg:text-[50px]"
          >
            Let’s Build Something
            <br />
            <span className="bg-grad-primary bg-clip-text text-transparent">Great Together.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-md text-[17px] leading-relaxed text-navy/60"
          >
            Whether you have a question, need support, want to partner with us, or simply want to learn more about
            BGrowth, we’re here to help.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button href="#message">Send a Message</Button>
            <Button variant="secondary" to="/systems">
              Explore Products
            </Button>
          </motion.div>
        </div>

        {/* Illustration — a static message-thread composition, no looping motion */}
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
              <span className="text-[11px] font-semibold text-navy/30">New Message</span>
            </div>

            <div className="rounded-xl2 border border-navy/[0.05] bg-bg-soft p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-grad-primary text-white">
                  <span className="font-display text-[12px] font-bold">BG</span>
                </div>
                <div className="flex-1">
                  <div className="h-2.5 w-2/5 rounded-full bg-navy/[0.12]" />
                  <div className="mt-1.5 h-2 w-3/5 rounded-full bg-navy/[0.08]" />
                </div>
              </div>
              <div className="mt-4 space-y-2 rounded-xl bg-white p-3.5 shadow-softer">
                <div className="h-2 w-full rounded-full bg-navy/[0.06]" />
                <div className="h-2 w-full rounded-full bg-navy/[0.06]" />
                <div className="h-2 w-2/3 rounded-full bg-navy/[0.06]" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-5 py-3.5 text-[11.5px] font-medium text-primary">
              <CheckCircle2 size={14} aria-hidden="true" />
              Delivered
            </div>
          </div>

          {/* Accent card — static, single entrance only */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute -bottom-4 -left-2 w-[190px] rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-glow sm:left-0"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-grad-primary text-white">
              <Clock size={17} strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="mt-3 text-[12.5px] font-semibold leading-snug text-navy">1–2 business days</p>
            <p className="mt-0.5 text-[11px] text-navy/40">average reply time</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
