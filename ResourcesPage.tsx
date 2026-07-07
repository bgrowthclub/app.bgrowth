import { useState } from 'react'
import { Video, ArrowRight, MapPin } from 'lucide-react'
import SEO from '../components/seo/SEO'
import SectionHeader from '../components/ui/SectionHeader'
import EmptyState from '../components/ui/EmptyState'
import MemberBanner from '../components/ui/MemberBanner'
import Button from '../components/ui/Button'
import ArticleCard from '../components/ui/ArticleCard'
import ResourceCard from '../components/systems/ResourceCard'
import type { SystemResource } from '../types/system'
import {
  FREE_DOWNLOADS,
  BUSINESS_GUIDES,
  TEMPLATES,
  BUSINESS_DOCUMENTS,
  RECOMMENDED_TOOLS,
  AFFILIATE_PARTNERS,
  ARTICLES,
  STATE_RESOURCES,
} from '../data/resources'

function ResourceRow({ title, items }: { title: string; items: SystemResource[] }) {
  return (
    <div>
      <SectionHeader eyebrow="Resources™" title={title} className="mb-8" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <ResourceCard key={r.title} resource={r} />
        ))}
      </div>
    </div>
  )
}

export default function ResourcesPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="Resources"
        description="Free guides, templates, and tools for launching and running a service business — from BGrowth."
        keywords={['free business templates', 'business guides', 'service business resources']}
        path="/resources"
      />

      {/* Hero */}
      <section className="container-px mx-auto max-w-page">
        <div className="max-w-xl">
          <p className="eyebrow">Resources</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Free tools to help you run a better business.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-navy/55">
            Software-style resources you can put to work today — no downloads to dig through.
          </p>
        </div>
      </section>

      <div className="container-px mx-auto mt-16 max-w-page space-y-16">
        <ResourceRow title="Featured Resources" items={[...FREE_DOWNLOADS.slice(0, 1), ...BUSINESS_GUIDES.slice(0, 1), ...TEMPLATES.slice(0, 1)]} />
        <ResourceRow title="Free Downloads" items={FREE_DOWNLOADS} />
        <ResourceRow title="Business Guides" items={BUSINESS_GUIDES} />
        <ResourceRow title="Templates" items={TEMPLATES} />
        <ResourceRow title="Business Documents" items={BUSINESS_DOCUMENTS} />

        {/* Recommended Tools */}
        <div>
          <SectionHeader eyebrow="Recommended Tools" title="Software we\u2019d actually use" className="mb-8" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RECOMMENDED_TOOLS.map((t) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl2 border border-navy/[0.06] bg-white p-5 shadow-softer transition-colors hover:border-primary/20"
              >
                <p className="text-[14px] font-semibold text-navy">{t.name}</p>
                <p className="mt-1.5 flex-1 text-[13px] text-navy/45">{t.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                  Visit
                  <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Affiliate Partners */}
        <div>
          <SectionHeader eyebrow="Affiliate Partners" title="Trusted by BGrowth" className="mb-8" />
          <div className="grid gap-3 sm:grid-cols-2">
            {AFFILIATE_PARTNERS.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3.5 rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-softer transition-colors hover:border-primary/20"
              >
                <div>
                  <p className="text-[13.5px] font-semibold text-navy">{p.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-navy/45">{p.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Helpful Articles */}
        <div>
          <SectionHeader eyebrow="Helpful Articles" title="Read before you launch" className="mb-8" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((a) => (
              <ArticleCard key={a.title} {...a} />
            ))}
          </div>
        </div>

        {/* Videos (Coming Soon) */}
        <div>
          <SectionHeader eyebrow="Videos" title="Coming soon" className="mb-8" />
          <EmptyState icon={Video} title="Video resources are on the way." description="We're producing walkthroughs for every Business System." />
        </div>

        {/* State Resources */}
        <div>
          <SectionHeader eyebrow="State Resources" title="Requirements by state" className="mb-8" />
          <div className="flex flex-wrap gap-2">
            {STATE_RESOURCES.map((state) => (
              <span
                key={state}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy/10 bg-white px-4 py-2 text-[13px] font-medium text-navy/60"
              >
                <MapPin size={12} className="text-primary" />
                {state}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter CTA */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <MemberBanner
            eyebrow="Newsletter"
            title="Get new resources first."
            description="One email a month — new templates, guides, and Business Systems as they launch."
            footnote="No spam, unsubscribe anytime."
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 focus:border-primary/30"
              />
              <Button type="submit" className="shrink-0">
                {submitted ? 'Subscribed' : 'Subscribe'}
              </Button>
            </form>
          </MemberBanner>
        </div>
      </section>
    </div>
  )
}
