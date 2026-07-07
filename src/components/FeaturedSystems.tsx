import { motion } from 'framer-motion'
import { ArrowUpRight, Stamp, Sparkles as SparklesIcon, Calculator, Wrench, ClipboardCheck, FolderKanban } from 'lucide-react'

const SYSTEMS = [
  {
    icon: Stamp,
    name: 'Start Your Notary Business™',
    type: 'Planner',
    desc: 'A complete launch path from licensing to your first signing appointment.',
    modules: 8,
    time: '2–3 weeks',
  },
  {
    icon: FolderKanban,
    name: 'Daily Notary Operations™',
    type: 'Workflow',
    desc: 'Run signings, journals, and client communication in one repeatable flow.',
    modules: 6,
    time: 'Ongoing',
  },
  {
    icon: ClipboardCheck,
    name: 'Loan Signing Workflow™',
    type: 'Workflow',
    desc: 'Step-by-step process from confirmation to funded and filed.',
    modules: 5,
    time: '1 week setup',
  },
  {
    icon: Wrench,
    name: 'Equipment Planner™',
    type: 'Toolkit',
    desc: 'Know exactly what to buy, in what order, and what it actually costs.',
    modules: 4,
    time: '3 days',
  },
  {
    icon: SparklesIcon,
    name: 'Cleaning Business Launch™',
    type: 'Business System',
    desc: 'Pricing, crews, and client intake — organized before your first job.',
    modules: 9,
    time: '2 weeks',
  },
  {
    icon: Calculator,
    name: 'Bookkeeping Operations™',
    type: 'Business System',
    desc: 'A monthly close process built for service businesses, not accountants.',
    modules: 7,
    time: 'Ongoing',
  },
]

export default function FeaturedSystems() {
  return (
    <section id="systems" className="section-py relative bg-bg-soft">
      <div className="container-px mx-auto max-w-7xl">
        <div className="mb-14 max-w-xl">
          <p className="eyebrow">Business Systems™</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Featured Systems
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-navy/55">
            Each system is a structured product — not a document. Built to be opened, followed, and worked from every day.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEMS.map((sys, i) => (
            <motion.div
              key={sys.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.55 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer transition-all duration-300 hover:border-primary/15 hover:shadow-glow"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
                  <sys.icon size={21} strokeWidth={2} />
                </div>
                <span className="rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
                  {sys.type}
                </span>
              </div>

              <h3 className="mt-5 font-display text-[17px] font-bold leading-snug text-navy">
                {sys.name}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-navy/50">{sys.desc}</p>

              <div className="mt-5 flex items-center gap-4 text-[12px] text-navy/40">
                <span>{sys.modules} modules</span>
                <span className="h-1 w-1 rounded-full bg-navy/20" />
                <span>{sys.time}</span>
              </div>

              <a
                href="#"
                className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary"
              >
                View System
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
