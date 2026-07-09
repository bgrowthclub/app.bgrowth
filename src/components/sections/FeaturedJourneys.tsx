import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import SectionHeader from '../ui/SectionHeader'
import Button from '../ui/Button'
import { SYSTEMS } from '../../data/systems'

export default function FeaturedJourneys() {
  // Same rule as before this section was renamed: a system appears here
  // purely because its data says `featured: true` — no hardcoded list.
  const featured = SYSTEMS.filter((s) => s.status === 'published' && s.featured)

  return (
    <section id="journeys" className="section-py relative bg-bg-soft">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader
          eyebrow="Featured Journeys"
          title="Real transformations, already underway."
          description="Every Journey is a guided path — the steps, tools, and structure to get from where you are to where you're going."
          action={
            <Button to="/systems" variant="secondary" icon={<ArrowRight size={16} />}>
              View All Journeys
            </Button>
          }
          className="mb-14"
        />

        <div className="flex flex-col gap-4">
          {featured.map((sys, i) => (
            <motion.div
              key={sys.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.55 }}
            >
              <BusinessSystemCard system={sys} variant="horizontal" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
