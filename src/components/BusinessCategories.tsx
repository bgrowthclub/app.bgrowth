import { motion } from 'framer-motion'
import {
  Stamp,
  Sparkles as SparklesIcon,
  Calculator,
  Truck,
  Waves,
  Trash2,
  FileText,
  Home,
  Hammer,
  Wrench,
} from 'lucide-react'

const CATEGORIES = [
  { icon: Stamp, name: 'Notary', desc: 'Loan signings & journals' },
  { icon: SparklesIcon, name: 'Cleaning', desc: 'Crews, jobs & routes' },
  { icon: Calculator, name: 'Bookkeeping', desc: 'Books that stay clean' },
  { icon: Truck, name: 'Delivery', desc: 'Routes & dispatch' },
  { icon: Waves, name: 'Pressure Washing', desc: 'Estimates & jobs' },
  { icon: Trash2, name: 'Junk Removal', desc: 'Pickups & pricing' },
  { icon: FileText, name: 'Tax Preparation', desc: 'Clients & filings' },
  { icon: Home, name: 'Real Estate', desc: 'Listings & leads' },
  { icon: Hammer, name: 'Contractor', desc: 'Bids & project flow' },
  { icon: Wrench, name: 'Handyman', desc: 'Calls & schedules' },
]

export default function BusinessCategories() {
  return (
    <section id="industries" className="section-py relative">
      <div className="container-px mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Industries</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Built for the businesses people actually run.
            </h2>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent md:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent md:w-24" />
        <div className="scrollbar-none container-px mx-auto flex max-w-7xl gap-4 overflow-x-auto pb-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group flex w-[190px] flex-shrink-0 flex-col gap-4 rounded-xl2 border border-navy/[0.06] bg-white p-5 shadow-softer transition-all duration-300 hover:border-primary/20 hover:shadow-soft"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-bg-soft text-primary transition-colors duration-300 group-hover:bg-grad-primary group-hover:text-white">
                <cat.icon size={20} strokeWidth={2} />
              </div>
              <div>
                <p className="font-display text-[15px] font-semibold text-navy">{cat.name}</p>
                <p className="mt-1 text-[13px] text-navy/45">{cat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
