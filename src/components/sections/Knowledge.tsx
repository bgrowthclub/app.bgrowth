import { ArrowRight } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import { usePageTexts } from '../../lib/usePageTexts'
import ArticleCard from '../ui/ArticleCard'
import Button from '../ui/Button'
import { ARTICLES } from '../../data/resources'
import { KNOWLEDGE_LIVE } from '../../data/contentStatus'

export default function Knowledge() {
  const t = usePageTexts()
  const preview = ARTICLES.slice(0, 3)

  return (
    <section id="knowledge" className="section-py relative">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader
          eyebrow={t.text('home.knowledge.eyebrow')}
          title={t.text('home.knowledge.title')}
          description={t.text('home.knowledge.description')}
          align="center"
          className="mb-14"
        />

        {KNOWLEDGE_LIVE ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((article) => (
                <ArticleCard key={article.title} {...article} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button to="/resources" variant="secondary" icon={<ArrowRight size={16} />}>
                Explore Knowledge
              </Button>
            </div>
          </>
        ) : (
          // Example articles stay hidden until real content is in
          // (data/contentStatus.ts).
          <div className="flex flex-col items-center gap-4">
            <span className="rounded-full bg-bg-soft px-4 py-1.5 text-[12.5px] font-semibold text-primary">Free guides, articles and videos — coming soon</span>
            <Button to="/knowledge" variant="secondary" icon={<ArrowRight size={16} />}>
              Get notified
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
