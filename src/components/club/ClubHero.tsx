import { motion } from 'framer-motion'
import { Sparkles, Users, Check } from 'lucide-react'
import Button from '../ui/Button'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

const MEMBER_BENEFITS = ['Member pricing on everything', 'Priority support', 'Exclusive resources']

export default function ClubHero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-20 md:pt-52 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />

      <div className="container-px relative mx-auto grid max-w-page items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="badge">
            <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
            BGROWTH CLUB™
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-[36px] font-bold leading-[1.14] tracking-tight text-navy sm:text-[44px] lg:text-[50px]"
          >
            Join <span className="bg-grad-primary bg-clip-text text-transparent">BGrowth Club.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-md text-[17px] leading-relaxed text-navy/60"
          >
            Unlock exclusive resources, premium business systems, member pricing, practical learning and a growing
            professional ecosystem designed to help you succeed.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/#become-a-member">Become a Member</Button>
            <Button variant="secondary" to="/systems">
              Explore Products
            </Button>
          </motion.div>
        </div>

        {/* Illustration — a static member-card composition, no looping motion */}
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
              <span className="text-[11px] font-semibold text-navy/30">Membership</span>
            </div>

            <div className="rounded-xl2 bg-grad-navy p-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-[13px] font-bold tracking-tight text-white">BGrowth Club™</span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white">PRO</span>
              </div>
              <div className="mt-6 h-2.5 w-2/3 rounded-full bg-white/25" />
              <div className="mt-2 h-2 w-1/3 rounded-full bg-white/15" />
            </div>

            <div className="mt-2 space-y-2 p-3">
              {MEMBER_BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-2.5 rounded-lg bg-bg-soft px-3.5 py-3">
                  <Check size={14} className="shrink-0 text-primary" strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-[12.5px] text-navy/70">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accent card — static, single entrance only */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute -bottom-4 -left-2 w-[180px] rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-glow sm:left-0"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-grad-primary text-white">
              <Users size={17} strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="mt-3 text-[12.5px] font-semibold leading-snug text-navy">12,400+ members</p>
            <p className="mt-0.5 text-[11px] text-navy/40">growing together every week</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
