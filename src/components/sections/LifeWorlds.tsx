import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import IndustryCard from '../systems/IndustryCard'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { WORKSPACE_CATEGORIES } from '../../data/workspaceCategories'
import { fadeUp, viewportOnce } from '../../lib/motion'

export default function LifeWorlds() {
  return (
    <section id="life-worlds" className="section-py relative">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader
          eyebrow="Workspace™"
          title="What do you want to achieve next?"
          description="Choose an interactive workspace designed to help you organize, learn, plan and accomplish meaningful goals."
          align="center"
          className="mb-14"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSPACE_CATEGORIES.map((category, i) => (
            <IndustryCard
              key={category.slug}
              icon={category.icon}
              name={category.name}
              description={category.description}
              to={category.count > 0 ? '/systems' : `/preview/${category.slug}`}
              index={i}
              count={category.count}
              ctaLabel={category.count > 0 ? 'Explore' : 'Preview'}
              hideEmptyStatus
            />
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14"
        >
          <Card padding="lg" className="mx-auto max-w-3xl text-center">
            <h3 className="font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">
              Ready to achieve something new?
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-navy/55">
              Discover interactive workspaces designed to help you take action, stay organized
              and move confidently toward your goals.
            </p>
            <div className="mt-7 flex justify-center">
              <Button to="/systems" icon={<ArrowRight size={16} />}>
                Explore All Workspaces
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
