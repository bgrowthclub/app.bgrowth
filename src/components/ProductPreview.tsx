import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, StickyNote, Zap } from 'lucide-react'

const TABS = ['Overview', 'Planner', 'Workflow', 'Templates', 'Resources'] as const

export default function ProductPreview() {
  const [active, setActive] = useState<(typeof TABS)[number]>('Overview')

  return (
    <section id="resources" className="section-py relative bg-bg-soft">
      <div className="container-px mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="eyebrow">Inside BGrowth</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Software you actually work from.
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-5xl rounded-xl3 border border-navy/[0.06] bg-white p-3 shadow-glow"
        >
          {/* window chrome */}
          <div className="flex items-center gap-1.5 px-3 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
          </div>

          {/* tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-navy/[0.06] px-3 pb-3">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  active === tab
                    ? 'bg-grad-primary text-white shadow-softer'
                    : 'text-navy/45 hover:bg-bg-soft hover:text-navy/70'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* content */}
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="contents"
              >
                {/* Progress card */}
                <div className="rounded-xl2 border border-navy/[0.05] bg-bg-soft p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12.5px] font-semibold text-navy/60">Progress</p>
                    <Zap size={14} className="text-primary" />
                  </div>
                  <div className="mt-6 flex items-center justify-center">
                    <div className="relative grid h-24 w-24 place-items-center rounded-full bg-white shadow-softer">
                      <svg viewBox="0 0 36 36" className="absolute h-full w-full -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EEF3FC" strokeWidth="3" />
                        <motion.circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="#1061EC"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={97.4}
                          initial={{ strokeDashoffset: 97.4 }}
                          whileInView={{ strokeDashoffset: 97.4 * 0.32 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </svg>
                      <span className="font-display text-lg font-bold text-navy">68%</span>
                    </div>
                  </div>
                </div>

                {/* Tasks card */}
                <div className="rounded-xl2 border border-navy/[0.05] bg-bg-soft p-5">
                  <p className="text-[12.5px] font-semibold text-navy/60">Tasks</p>
                  <div className="mt-4 space-y-2.5">
                    {[
                      { label: 'Register business entity', done: true },
                      { label: 'Set service pricing', done: true },
                      { label: 'Publish request page', done: false },
                    ].map((t) => (
                      <div key={t.label} className="flex items-center gap-2.5">
                        {t.done ? (
                          <CheckCircle2 size={16} className="text-primary" />
                        ) : (
                          <Circle size={16} className="text-navy/20" />
                        )}
                        <span
                          className={`text-[13px] ${
                            t.done ? 'text-navy/35 line-through' : 'text-navy/70'
                          }`}
                        >
                          {t.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes / Quick actions card */}
                <div className="rounded-xl2 border border-navy/[0.05] bg-bg-soft p-5">
                  <div className="flex items-center gap-2">
                    <StickyNote size={14} className="text-primary" />
                    <p className="text-[12.5px] font-semibold text-navy/60">Quick Actions</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {['Add client', 'Send quote', 'Open checklist'].map((a) => (
                      <div
                        key={a}
                        className="rounded-lg border border-navy/[0.05] bg-white px-3 py-2 text-[12.5px] font-medium text-navy/60 shadow-softer"
                      >
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
