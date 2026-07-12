import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SEO from '../components/seo/SEO'
import SearchBar from '../components/ui/SearchBar'
import IndustryCard from '../components/systems/IndustryCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { WORKSPACE_CATEGORIES } from '../data/workspaceCategories'
import { fadeUp, viewportOnce } from '../lib/motion'

// The standalone entry point into the Workspace™ ecosystem — same content
// and same WORKSPACE_CATEGORIES source as the homepage's Workspace section
// (components/sections/LifeWorlds.tsx).
export default function WorkspacesPage() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return WORKSPACE_CATEGORIES
    return WORKSPACE_CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query])

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="Workspace™"
        description="Choose an interactive workspace designed to help you organize, learn, plan and accomplish meaningful goals."
        keywords={['bgrowth workspace', 'growth systems', 'business workspace', 'personal growth']}
        path="/workspaces"
      />

      {/* Hero */}
      <section className="container-px mx-auto max-w-page text-center">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">Workspace™</p>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            What do you want to achieve next?
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-navy/55">
            Choose an interactive workspace designed to help you organize, learn, plan and
            accomplish meaningful goals.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-xl">
          <SearchBar value={query} onChange={setQuery} placeholder="Search Workspaces…" />
        </div>
      </section>

      {/* Category grid */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((category, i) => (
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
          ) : (
            <div className="rounded-xl3 border border-navy/[0.06] bg-white p-12 text-center shadow-softer">
              <p className="font-display text-lg font-bold text-navy">No Workspaces match your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA panel */}
      <section className="container-px mx-auto max-w-page">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
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
      </section>
    </div>
  )
}
