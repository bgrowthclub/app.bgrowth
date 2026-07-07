import { motion } from 'framer-motion'
import { Signpost, Layers, Clock, ShieldCheck } from 'lucide-react'

const POINTS = [
  { icon: Signpost, title: 'Step-by-step guidance', desc: 'Always know the next action.' },
  { icon: Layers, title: 'Professional workflows', desc: 'Built by people who run these businesses.' },
  { icon: Clock, title: 'Save time', desc: 'Skip months of trial and error.' },
  { icon: ShieldCheck, title: 'Grow with confidence', desc: 'A system that scales as you do.' },
]

export default function WhyBGrowth() {
  return (
    <section className="section-py relative">
      <div className="container-px mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="rounded-xl3 border border-navy/[0.06] bg-grad-navy p-10 shadow-glow md:p-14"
        >
          <div className="max-w-lg">
            <p className="eyebrow !text-white/60">Why BGrowth</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              A system, not a stack of documents.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {POINTS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
                  <p.icon size={18} strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 font-display text-[15px] font-semibold text-white">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
