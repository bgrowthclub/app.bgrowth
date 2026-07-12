import { motion } from 'framer-motion'
import { Building2, Briefcase, PiggyBank, HeartPulse, GraduationCap, Home as HomeIcon, ArrowRight } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import IndustryCard from '../systems/IndustryCard'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { SYSTEMS } from '../../data/systems'
import { fadeUp, viewportOnce } from '../../lib/motion'

// Six Life Worlds for the homepage narrative — a curated, homepage-only
// presentation of BGrowth's Growth Categories (see src/types/growth.ts and
// PRODUCT_CATALOG.md), not a new data model. Only Business & Entrepreneurship
// has real catalog data today, so it's the only World that links straight
// into /systems — the rest link to an honest per-category preview page
// (see data/categoryPreviews.ts, pages/CategoryPreviewPage.tsx) instead of
// claiming a catalog that doesn't exist yet.
const publishedCount = SYSTEMS.filter((s) => s.status === 'published').length

const LIFE_WORLDS = [
  { slug: 'business', icon: Briefcase, name: 'Business', desc: 'Start, launch, and run something of your own.', count: publishedCount },
  { slug: 'career', icon: Building2, name: 'Career', desc: 'Grow into the profession you actually want.', count: 0 },
  { slug: 'finance', icon: PiggyBank, name: 'Finance', desc: 'Take control of money, budgeting, and the future.', count: 0 },
  { slug: 'health', icon: HeartPulse, name: 'Health', desc: 'Build habits that make you stronger, longer.', count: 0 },
  { slug: 'learning', icon: GraduationCap, name: 'Learning', desc: 'Pick up the skills and languages that open doors.', count: 0 },
  { slug: 'lifestyle', icon: HomeIcon, name: 'Lifestyle', desc: 'Shape a life and a home you want to come back to.', count: 0 },
]

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
          {LIFE_WORLDS.map((world, i) => (
            <IndustryCard
              key={world.name}
              icon={world.icon}
              name={world.name}
              description={world.desc}
              to={world.count > 0 ? '/systems' : `/preview/${world.slug}`}
              index={i}
              count={world.count}
              ctaLabel={world.count > 0 ? 'Explore' : 'Preview'}
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
