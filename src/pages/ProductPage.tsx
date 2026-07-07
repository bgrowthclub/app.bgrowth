import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckSquare, Square, Users } from 'lucide-react'
import Badge from '../components/ui/Badge'
import SectionHeader from '../components/ui/SectionHeader'
import FeatureGrid from '../components/ui/FeatureGrid'
import PricingCard from '../components/ui/PricingCard'
import EmptyState from '../components/ui/EmptyState'
import Grid from '../components/layout/Grid'
import ModuleBadge from '../components/systems/ModuleBadge'
import BusinessSystemCard from '../components/systems/BusinessSystemCard'
import ResourceCard from '../components/systems/ResourceCard'
import TestimonialCard from '../components/systems/TestimonialCard'
import FAQ from '../components/ui/FAQ'
import { getSystemBySlug, getRelatedSystems } from '../data/systems'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const system = slug ? getSystemBySlug(slug) : undefined

  if (!system) return <Navigate to="/systems" replace />

  const previewComponent = system.components[0]
  const previewSection = previewComponent.content[0]
  const related = getRelatedSystems(system)

  return (
    <div className="pt-32 md:pt-40">
      {/* Hero */}
      <section className="container-px mx-auto max-w-page pb-16">
        <Link to="/systems" className="text-[13px] font-semibold text-primary">
          ← Back to Business Systems
        </Link>

        <div className="mt-6 grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{system.category}</Badge>
              <Badge variant="outline">{system.type}</Badge>
              <Badge variant="outline">{system.difficulty}</Badge>
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl">
              {system.name}
            </h1>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-navy/55">{system.description}</p>

            <div className="mt-6 flex items-center gap-4 text-[13px] text-navy/40">
              <span>{system.modules} modules</span>
              <span className="h-1 w-1 rounded-full bg-navy/20" />
              <span>{system.estimatedTime}</span>
            </div>
          </div>

          {/* Interactive preview image (not a static PDF preview — a working software preview) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="rounded-xl3 border border-navy/[0.06] bg-white p-2 shadow-glow"
          >
            <div className="flex items-center gap-1.5 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy/10" />
              <span className="ml-2 text-[11px] font-semibold text-navy/30">{previewComponent.name}</span>
            </div>
            <div className="rounded-xl2 border border-navy/[0.05] bg-bg-soft p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                {previewSection.title}
              </p>
              <div className="mt-4 space-y-2.5">
                {previewSection.fields.slice(0, 4).map((field, i) => (
                  <div key={field.id} className="flex items-center gap-2.5 rounded-lg bg-white px-3.5 py-3 shadow-softer">
                    {field.type === 'checkbox' ? (
                      i === 0 ? (
                        <CheckSquare size={16} className="shrink-0 text-primary" />
                      ) : (
                        <Square size={16} className="shrink-0 text-navy/20" />
                      )
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-md border border-navy/15" />
                    )}
                    <span className="text-[13px] text-navy/70">{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modules Included */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="Modules Included" title="What's inside this system" className="mb-10" />
          <Grid cols={3}>
            {system.components.map((c) => (
              <div key={c.id} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
                <ModuleBadge type={c.type} />
                <h3 className="mt-4 font-display text-[15px] font-bold text-navy">{c.name}</h3>
                {c.description && <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{c.description}</p>}
              </div>
            ))}
          </Grid>
        </div>
      </section>

      {/* What's Included + Resources */}
      <section className="section-py">
        <div className="container-px mx-auto grid max-w-page gap-14 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="What's Included" title="Everything in this system" className="mb-8" />
            <ul className="space-y-3">
              {system.whatsIncluded.map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-xl border border-navy/[0.06] bg-white px-4 py-3.5 shadow-softer">
                  <CheckSquare size={16} className="shrink-0 text-primary" />
                  <span className="text-[14px] text-navy/70">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader eyebrow="Resources™" title="Templates & tools" className="mb-8" />
            <div className="space-y-3">
              {system.resources.map((r) => (
                <ResourceCard key={r.title} resource={r} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="Benefits" title="What it helps you do" className="mb-10" />
          <FeatureGrid features={system.features} />
        </div>
      </section>

      {/* Who Is This For */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="Who Is This For" title="Built for people like you" className="mb-8" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {system.audience.map((a) => (
              <div key={a} className="flex items-center gap-3 rounded-xl border border-navy/[0.06] bg-white px-4 py-3.5 shadow-softer">
                <Users size={16} className="shrink-0 text-primary" />
                <span className="text-[14px] text-navy/70">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Systems */}
      {related.length > 0 && (
        <section className="section-py bg-bg-soft">
          <div className="container-px mx-auto max-w-page">
            <SectionHeader eyebrow="Related Systems" title="You might also need" className="mb-10" />
            <Grid cols={3}>
              {related.map((r) => (
                <BusinessSystemCard key={r.slug} system={r} />
              ))}
            </Grid>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="Customer Reviews" title="What people say" className="mb-10" />
          {system.reviews.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {system.reviews.map((r) => (
                <TestimonialCard key={r.name} review={r} />
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet." description="Be the first to complete this system and leave one." />
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-narrow">
          <SectionHeader eyebrow="FAQ" title="Good to know" align="center" className="mb-10" />
          <FAQ items={system.faq} />
        </div>
      </section>

      {/* Purchase */}
      <section className="pb-28 pt-20">
        <div className="container-px mx-auto max-w-narrow">
          <PricingCard
            name={system.name}
            price={system.price}
            memberPrice={system.memberPrice}
            checkoutUrl={system.checkoutUrl}
          />
        </div>
      </section>
    </div>
  )
}
