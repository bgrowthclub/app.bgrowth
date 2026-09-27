import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'

interface Props {
  article: KnowledgeArticleIndexEntry
  categoryName?: string
}

// The Featured Videos card — a distinct sibling from KnowledgeArticleCard
// (per the Component Evolution Rule) because a video's primary visual is a
// play-button thumbnail, not a type-icon block. No stock photography: the
// "thumbnail" is a brand-gradient panel with a play button, same visual
// language as every other Knowledge card.
export default function VideoCard({ article, categoryName }: Props) {
  return (
    <Link
      to={`/knowledge/article/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="relative flex h-44 items-center justify-center bg-grad-navy">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-primary shadow-glow transition-transform duration-300 group-hover:scale-110">
          <Play size={22} className="translate-x-0.5" fill="currentColor" />
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-navy/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {article.readingTimeMinutes} min
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        {categoryName && (
          <span className="w-fit rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
            {categoryName}
          </span>
        )}
        <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-navy">{article.title}</h3>
        <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-navy/50">{article.excerpt}</p>
      </div>
    </Link>
  )
}
