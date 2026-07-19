import { useState } from 'react'
import SEO from '../components/seo/SEO'
import SectionContainer from '../components/layout/SectionContainer'
import SectionHeader from '../components/ui/SectionHeader'
import MemberBanner from '../components/ui/MemberBanner'
import Button from '../components/ui/Button'
import KnowledgeHero from '../components/knowledge/KnowledgeHero'
import KnowledgeArticleCard from '../components/knowledge/KnowledgeArticleCard'
import CategoryCard from '../components/knowledge/CategoryCard'
import FreeResourceCard from '../components/knowledge/FreeResourceCard'
import GuideCard from '../components/knowledge/GuideCard'
import KnowledgeFinalCTA from '../components/knowledge/KnowledgeFinalCTA'
import { FEATURED_ARTICLES, ARTICLE_CATEGORIES, FREE_RESOURCES, FEATURED_GUIDES } from '../data/knowledge'

export default function KnowledgePage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <div>
      <SEO
        title="Knowledge"
        description="Practical guides, business insights, career advice, and real strategies to help you learn, launch, work, manage and grow — from BGrowth."
        keywords={['business guides', 'career advice', 'free business resources', 'BGrowth Knowledge']}
        path="/knowledge"
      />

      <KnowledgeHero />

      <SectionContainer id="articles" aria-label="Featured Articles">
        <SectionHeader
          eyebrow="Featured Articles"
          title="Start with what's working right now."
          description="Practical, no-fluff articles across business, career, money, and more."
          className="mb-10"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_ARTICLES.map((article) => (
            <KnowledgeArticleCard key={article.id} article={article} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer id="categories" background="soft" aria-label="Browse by Category">
        <SectionHeader
          eyebrow="Browse by Category"
          title="Find knowledge for exactly where you are."
          description="Every topic BGrowth covers, organized so you can go straight to what matters to you."
          className="mb-10"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ARTICLE_CATEGORIES.map((category, i) => (
            <CategoryCard key={category.id} category={category} index={i} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer aria-label="Free Resources">
        <SectionHeader
          eyebrow="Free Resources"
          title="Downloadable tools, no strings attached."
          description="Checklists, worksheets, templates and guides you can put to work today."
          className="mb-10"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FREE_RESOURCES.map((resource) => (
            <FreeResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer background="soft" aria-label="Featured Guides">
        <SectionHeader
          eyebrow="Featured Guides"
          title="In-depth guides for bigger decisions."
          description="Longer reads for the moments that deserve more than a quick article."
          className="mb-10"
        />
        <div className="flex flex-col gap-5">
          {FEATURED_GUIDES.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer aria-label="Newsletter">
        <MemberBanner
          eyebrow="Newsletter"
          title="Keep Growing Every Week"
          description="Receive practical business tips, free resources and new guides directly in your inbox."
          footnote="No spam, unsubscribe anytime."
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="knowledge-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="knowledge-newsletter-email"
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
      </SectionContainer>

      <SectionContainer aria-label="Explore BGrowth" className="!pt-0">
        <KnowledgeFinalCTA />
      </SectionContainer>
    </div>
  )
}
