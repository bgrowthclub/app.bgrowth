import { motion } from 'framer-motion'
import { Rocket, Settings2, TrendingUp } from 'lucide-react'

const STEPS = [
  {
    icon: Rocket,
    title: 'Launch',
    tag: 'Business planners',
    desc: 'Follow a structured planner that takes you from idea to open for business.',
  },
  {
    icon: Settings2,
    title: 'Operate',
    tag: 'Daily workflows',
    desc: 'Run your day-to-day with workflows built specifically for your industry.',
  },
  {
    icon: TrendingUp,
    title: 'Grow',
    tag: 'Templates, resources, calculators, dashboard',
    desc: 'Add templates, tools, and reporting as your business scales up.',
  },
]

export default function HowItWorks() {
  return (
    <section className="section-py relative overflow-hidden">
      <div className="container-px mx-auto max-w-7xl">
        <div className="mb-16 max-w-xl">
          <p className="eyebrow">The Process</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            How BGrowth Works
          </h2>
        </div>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* connecting line */}
          <div className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px md:block">
            <svg width="100%" height="2" className="overflow-visible">
              <motion.line
                x1="16%"
                y1="1"
                x2="84%"
                y2="1"
                stroke="url(#lineGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1061EC" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#2F80FF" stopOpacity="0.15" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="relative rounded-xl3 border border-navy/[0.06] bg-white p-7 shadow-softer"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-navy text-white">
                  <step.icon size={19} strokeWidth={2} />
                </div>
                <span className="font-display text-lg font-bold text-navy/15">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-navy">{step.title}</h3>
              <p className="mt-1.5 text-[12.5px] font-semibold uppercase tracking-wide text-primary/70">
                {step.tag}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-navy/50">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
