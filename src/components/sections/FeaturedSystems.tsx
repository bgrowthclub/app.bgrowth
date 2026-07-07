import { motion } from 'framer-motion'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import SectionHeader from '../ui/SectionHeader'
import { SYSTEMS } from '../../data/systems'

const FEATURED_SLUGS = [
  'start-your-notary-business',
  'notary-equipment-planner',
  'daily-notary-operations',
  'notary-signing-agent-workflow',
]

export default function FeaturedSystems() {
  const featured = SYSTEMS.filter((s) => FEATURED_SLUGS.includes(s.slug))

  return (
    <section id="systems" className="section-py relative bg-bg-soft">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader
          eyebrow="Business Systems™"
          title="Featured Systems"
          description="Each system bundles the modules you need — Planners™, Workflows™, Toolkits™, and Resources™ — into one guided product."
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
