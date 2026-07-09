import { Building2, Briefcase, PiggyBank, HeartPulse, GraduationCap, Home as HomeIcon } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import IndustryCard from '../systems/IndustryCard'
import { SYSTEMS } from '../../data/systems'

// Six Life Worlds for the homepage narrative — a curated, homepage-only
// presentation of BGrowth's Growth Categories (see src/types/growth.ts and
// PRODUCT_CATALOG.md), not a new data model. Only Business & Entrepreneurship
// has real catalog data today, so it's the only world that links into real
// content; the rest honestly show "Coming soon" via IndustryCard's existing
// count===0 state rather than faking systems that don't exist yet.
const publishedCount = SYSTEMS.filter((s) => s.status === 'published').length

const LIFE_WORLDS = [
  { icon: Briefcase, name: 'Business', desc: 'Start, launch, and run something of your own.', count: publishedCount },
  { icon: Building2, name: 'Career', desc: 'Grow into the profession you actually want.', count: 0 },
  { icon: PiggyBank, name: 'Finance', desc: 'Take control of money, budgeting, and the future.', count: 0 },
  { icon: HeartPulse, name: 'Health', desc: 'Build habits that make you stronger, longer.', count: 0 },
  { icon: GraduationCap, name: 'Learning', desc: 'Pick up the skills and languages that open doors.', count: 0 },
  { icon: HomeIcon, name: 'Lifestyle', desc: 'Shape a life and a home you want to come back to.', count: 0 },
]

export default function LifeWorlds() {
  return (
    <section id="life-worlds" className="section-py relative">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader
          eyebrow="Life Worlds"
          title="Every part of your life is worth growing."
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
              to="/systems"
              index={i}
              count={world.count}
              ctaLabel={world.count > 0 ? 'Explore' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
