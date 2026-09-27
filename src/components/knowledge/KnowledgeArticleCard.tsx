import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock } from 'lucide-react'
import { KNOWLEDGE_TYPE_ICONS } from './knowledgeTypeIcons'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'

interface Props {
  article: KnowledgeArticleIndexEntry
  categoryName?: string
  authorName?: string
  // 'featured' is a larger, hero-style presentation for curated placements
  // (Featured Articles/Guides/Videos) — same card, same link, same data,
  // just more visual weight. Not a fork per the Component Evolution Rule:
  // both variants render the exact same KnowledgeArticleIndexEntry shape.
  variant?: 'default' | 'featured'
}

// The Knowledge Hub's card for every content type (Article, Guide,
// Checklist, Planner, Calculator, Template, Download) — Video gets its own
// sibling, VideoCard, since a play-button thumbnail is a genuinely
// different layout, not a variant of this one. No stock photography
// anywhere: the visual is the type icon on a brand-gradient block, matching
// BusinessSystemCard's existing pattern.
export default function KnowledgeArticleCard({ article, categoryName, authorName, variant = 'default' }: Props) {
  const Icon = KNOWLEDGE_TYPE_ICONS[article.type]
  const isFeatured = variant === 'featured'

  return (
    <Link
      to={`/knowledge/article/${article.slug}`}
      className={`group flex flex-col rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow ${
        isFeatured ? 'p-7' : 'p-6'
      }`}
    >
      <div
        className={`grid place-items-center rounded-2xl bg-grad-primary text-white shadow-soft ${
          isFeatured ? 'h-40 w-full' : 'h-12 w-12'
        }`}
      >
        <Icon size={isFeatured ? 40 : 21} strokeWidth={1.75} />
      </div>

      <div className={`flex flex-wrap items-center gap-2 ${isFeatured ? 'mt-6' : 'mt-5'}`}>
        <span className="rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
          {article.type}
        </span>
        {categoryName && <span className="text-[11px] font-medium text-navy/35">{categoryName}</span>}
      </div>

      <h3
        className={`mt-3 font-display font-bold leading-snug text-navy ${
          isFeatured ? 'text-[21px]' : 'text-[15px]'
        }`}
      >
        {article.title}
      </h3>
      <p className={`mt-2 flex-1 leading-relaxed text-navy/50 ${isFeatured ? 'text-[14.5px]' : 'text-[13.5px]'}`}>
        {article.excerpt}
      </p>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[12px] text-navy/40">
          {authorName && <span className="font-medium text-navy/55">{authorName}</span>}
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} />
            {article.readingTimeMinutes} min read
          </span>
        </div>
        <ArrowUpRight
          size={15}
          className="shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </Link>
  )
}
