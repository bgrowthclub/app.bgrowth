import { motion } from 'framer-motion'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import SectionHeader from '../ui/SectionHeader'
import { SYSTEMS } from '../../data/systems'

export default function FeaturedSystems() {
  // No hardcoded product list — a system appears here purely because its
  // exported data says `featured: true`. Add or remove a system from this
  // section by editing that one field, not this component.
  const featured = SYSTEMS.filter((s) => s.status === 'published' && s.featured)

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
