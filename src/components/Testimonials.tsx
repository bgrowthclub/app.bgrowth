import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const REVIEWS = [
  {
    quote:
      'The systems are incredibly easy to follow. Instead of wondering what to do next, I simply follow the workflow.',
    name: 'Jessica M.',
    role: 'Notary Public',
    place: 'California',
  },
  {
    quote: 'I launched my business in less than three weeks because everything was already organized.',
    name: 'David R.',
    role: 'Cleaning Business Owner',
    place: '',
  },
  {
    quote: 'The planners helped me stop feeling overwhelmed.',
    name: 'Amanda S.',
    role: 'Bookkeeper',
    place: '',
  },
]

export default function Testimonials() {
  return (
    <section className="section-py relative">
      <div className="container-px mx-auto max-w-7xl">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
              What business owners say.
            </h2>
          </div>
          <a href="#" className="btn-secondary">
            See All Reviews
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer"
            >
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="mt-4 text-[14.5px] leading-relaxed text-navy/70">“{r.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-grad-primary font-display text-[13px] font-bold text-white">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-navy">{r.name}</p>
                  <p className="text-[12px] text-navy/40">
                    {r.role}
                    {r.place ? ` · ${r.place}` : ''}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
