import { ArrowRight } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import { usePageTexts } from '../../lib/usePageTexts'
import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import KnowledgeArticleCard from '../knowledge/KnowledgeArticleCard'
import { knowledgeService } from '../../modules/knowledge/services/KnowledgeService'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import { KNOWLEDGE_LIVE } from '../../data/contentStatus'

export default function Knowledge() {
  const t = usePageTexts()
  // The three newest articles published from BGrowth Studio.
  const [preview, setPreview] = useState<KnowledgeArticleIndexEntry[] | null>(null)

  useEffect(() => {
    if (!KNOWLEDGE_LIVE) return
    let cancelled = false
    knowledgeService.getLatestArticles(3).then((list) => !cancelled && setPreview(list))
    return () => {
      cancelled = true
    }
  }, [])

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

        {KNOWLEDGE_LIVE && preview === null ? (
          <div className="h-40" />
        ) : KNOWLEDGE_LIVE && preview && preview.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((article) => (
                <KnowledgeArticleCard key={article.id} article={article} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button to="/knowledge" variant="secondary" icon={<ArrowRight size={16} />}>
                Explore Knowledge
              </Button>
            </div>
          </>
        ) : (
          // Nothing published from Studio yet (or Knowledge off in
          // data/contentStatus.ts).
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
