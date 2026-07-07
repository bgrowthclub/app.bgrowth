import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import SEO from '../components/seo/SEO'
import SearchBar from '../components/ui/SearchBar'
import IndustryCard from '../components/systems/IndustryCard'
import { INDUSTRIES, getIndustrySystemCount } from '../data/industries'

export default function IndustriesPage() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return INDUSTRIES
    return INDUSTRIES.filter(
      (i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.description.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query])

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="Industries"
        description="Browse BGrowth Business Systems by profession — notary, cleaning, bookkeeping, delivery, and more."
        keywords={['business systems by industry', 'notary business systems', 'cleaning business systems']}
        path="/industries"
      />

      {/* Hero */}
      <section className="container-px mx-auto max-w-page">
        <div className="max-w-xl">
          <div className="badge">
            <Sparkles size={14} strokeWidth={2.5} />
            Industries
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Find Your Business
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-navy/55">
            Business Systems built specifically for your profession.
          </p>
        </div>
        <div className="mt-8 max-w-xl">
          <SearchBar value={query} onChange={setQuery} placeholder="Search industries…" />
        </div>
      </section>

      {/* Industry grid */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((industry, i) => (
                <IndustryCard
                  key={industry.slug}
                  icon={industry.icon}
                  name={industry.name}
                  description={industry.description}
                  to={
                    industry.categoryMatch
                      ? `/systems?category=${encodeURIComponent(industry.categoryMatch)}`
                      : '/systems'
                  }
                  index={i}
                  count={getIndustrySystemCount(industry)}
                  ctaLabel="Browse Systems"
                />
              ))}

              {/* Trailing teaser card, per brief's "More Coming Soon" */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: results.length * 0.05, duration: 0.5 }}
                className="flex flex-col items-start justify-center gap-2 rounded-xl2 border border-dashed border-navy/15 bg-bg-soft p-5"
              >
                <p className="font-display text-[15px] font-semibold text-navy/50">More Coming Soon</p>
                <p className="text-[13px] text-navy/40">New industries are added regularly.</p>
              </motion.div>
            </div>
          ) : (
            <div className="rounded-xl3 border border-navy/[0.06] bg-white p-12 text-center shadow-softer">
              <p className="font-display text-lg font-bold text-navy">No industries match your search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
