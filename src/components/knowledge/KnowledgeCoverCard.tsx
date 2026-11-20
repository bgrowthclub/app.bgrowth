import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Lock } from 'lucide-react'
import { KNOWLEDGE_TYPE_ICONS } from './knowledgeTypeIcons'
import { knowledgeCategoryLook } from './knowledgeCategoryIcons'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'

interface Props {
  article: KnowledgeArticleIndexEntry
  categoryName?: string
}

// The Knowledge hub's "Latest" card (19/11/2026, the owner's design): the
// cover across the top with the category on it, title, summary, reading time
// and "Read article". A sibling of KnowledgeArticleCard, which other pages
// keep.
export default function KnowledgeCoverCard({ article, categoryName }: Props) {
  const Icon = KNOWLEDGE_TYPE_ICONS[article.type]
  const { tone } = knowledgeCategoryLook(article.categorySlug)
  const locked = article.access === 'members' || article.access === 'plan'
  return (
    <Link
      to={`/knowledge/article/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-bg-soft">
        {article.coverImage ? (
          <img src={article.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-grad-primary text-white">
            <Icon size={36} strokeWidth={1.6} />
          </div>
        )}
        {categoryName && (
          <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide shadow-softer ${tone}`}>
            {categoryName}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[16px] font-bold leading-snug text-navy">{article.title}</h3>
        <div className="flex-1">
          <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-navy/55">{article.excerpt}</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-navy/[0.06] px-5 py-3.5 text-[12.5px]">
        <span className="inline-flex items-center gap-3 text-navy/45">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} /> {article.readingTimeMinutes} min read
          </span>
          {locked && (
            <span className="inline-flex items-center gap-1">
              <Lock size={11} /> {article.access === 'plan' ? article.requiredPlan?.name ?? 'Plan' : 'Members'}
            </span>
          )}
          {article.language === 'pt' && <span>Português</span>}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          Read <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
