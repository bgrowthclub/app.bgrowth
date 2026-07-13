import { ArrowRight } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import ArticleCard from '../ui/ArticleCard'
import Button from '../ui/Button'
import { ARTICLES } from '../../data/resources'

export default function Knowledge() {
  const preview = ARTICLES.slice(0, 3)

  return (
    <section id="knowledge" className="section-py relative">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader
          eyebrow="Knowledge"
          title="Knowledge should be accessible to everyone."
          description="Every meaningful journey begins by learning something new. Explore practical knowledge designed to help you move forward with confidence."
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
