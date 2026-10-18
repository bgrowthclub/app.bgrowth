import { ArrowRight } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import { usePageTexts } from '../../lib/usePageTexts'
import ArticleCard from '../ui/ArticleCard'
import Button from '../ui/Button'
import { ARTICLES } from '../../data/resources'

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
      </div>
    </section>
  )
}
