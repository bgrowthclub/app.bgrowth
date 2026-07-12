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
        {/* WORKSPACE™ — the ecosystem title. Deliberately heavier than a
            standard SectionHeader eyebrow (bigger, bolder, pill-badged,
            like the Hero's own "GO BEYOND." mark) since this is the name
            of the product itself, not just a section label. */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mb-5 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-bg-soft px-5 py-2 text-sm font-bold uppercase tracking-[0.14em] text-primary shadow-softer">
            Workspace™
          </span>
        </motion.div>

        <SectionHeader
          title="What do you want to achieve next?"
          description="Choose an interactive workspace designed to help you organize, learn, plan and accomplish meaningful goals."
          align="center"
          className="mb-11"
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
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
              unitLabel="Workspace"
              hideEmptyStatus
            />
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 sm:mt-14"
        >
          <Card padding="lg" className="mx-auto max-w-3xl text-center">
            <h3 className="font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">
              Ready to achieve something meaningful?
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-navy/55">
              Discover interactive Workspaces designed to help you organize, learn, plan and
              accomplish your goals, one step at a time.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button to="/systems" icon={<ArrowRight size={16} />}>
                Explore All Workspaces
              </Button>
              <Button to="/about#how-it-works" variant="secondary">
                How Workspaces Work
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
