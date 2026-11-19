import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'

interface Props {
  article: KnowledgeArticleIndexEntry
  categoryName?: string
}

// The dark band on the Knowledge hub (19/11/2026): one article marked
// "Featured" in the Studio, with its cover on the right.
export default function KnowledgeSpotlight({ article, categoryName }: Props) {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-navy px-6 py-10 text-white shadow-glow sm:px-10 md:py-12">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-white/60">
            <span className="rounded-full bg-primary px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">Featured</span>
            {categoryName && <span>{categoryName}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} /> {article.readingTimeMinutes} min read
            </span>
          </div>
          <h2 className="mt-5 font-display text-[26px] font-bold leading-tight sm:text-[32px]">{article.title}</h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">{article.excerpt}</p>
          <Link to={`/knowledge/article/${article.slug}`} className="btn-primary mt-7 inline-flex">
            Read the full guide <ArrowRight size={16} />
          </Link>
        </div>
        {article.coverImage && (
          <Link to={`/knowledge/article/${article.slug}`} className="block overflow-hidden rounded-2xl border border-white/10">
            <img src={article.coverImage} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </Link>
        )}
      </div>
    </div>
  )
}
