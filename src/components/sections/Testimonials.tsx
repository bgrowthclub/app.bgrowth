import { motion } from 'framer-motion'
import TestimonialCard from '../systems/TestimonialCard'
import SectionHeader from '../ui/SectionHeader'
import Button from '../ui/Button'
import { SYSTEMS } from '../../data/systems'

const REVIEWS = SYSTEMS[0].reviews

export default function Testimonials() {
  return (
    <section className="section-py relative">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader
          eyebrow="Reviews"
          title="What business owners say."
          action={
            <Button variant="secondary" href="#">
              See All Reviews
            </Button>
          }
          className="mb-14"
        />

        <div className="grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
            >
              <TestimonialCard review={r} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
