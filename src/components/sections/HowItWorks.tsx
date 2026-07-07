import { motion } from 'framer-motion'
import { MousePointerClick, ListChecks, Printer } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'

const STEPS = [
  { icon: MousePointerClick, title: 'Choose a Business System', desc: 'Find the system built for your industry.' },
  { icon: ListChecks, title: 'Complete Interactive Modules', desc: 'Work through Planners™, Workflows™, and Toolkits™ right in your browser.' },
  { icon: Printer, title: 'Print or Save PDF', desc: 'Keep a copy whenever you need one.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-py relative overflow-hidden">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader eyebrow="The Process" title="How BGrowth Works" className="mb-16" />

        <div className="relative grid gap-6 sm:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-[44px] hidden h-px sm:block">
            <svg width="100%" height="2" className="overflow-visible">
              <motion.line
                x1="14%"
                y1="1"
                x2="86%"
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
                <span className="font-display text-lg font-bold text-navy/15">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-display text-[16px] font-bold text-navy">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-navy/50">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
