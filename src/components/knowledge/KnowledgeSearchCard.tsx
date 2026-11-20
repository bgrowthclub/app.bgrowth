import { Link } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import { KNOWLEDGE_TYPE_ICONS } from './knowledgeTypeIcons'
import { knowledgeCategoryLook } from './knowledgeCategoryIcons'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import type { KnowledgeType } from '../../modules/knowledge/types/knowledgeType'

interface Props {
  article: KnowledgeArticleIndexEntry
  categoryName?: string
  /** The article's first tag, by name (Studio / the Wix hashtags). */
  tagName?: string
}

const TYPE_BADGE: Record<KnowledgeType, string> = {
  Article: 'bg-blue-600',
  Guide: 'bg-emerald-600',
  Checklist: 'bg-orange-500',
  Planner: 'bg-teal-600',
  Calculator: 'bg-violet-600',
  Template: 'bg-purple-600',
  Video: 'bg-rose-600',
  Download: 'bg-indigo-600',
}

const ACTION: Record<KnowledgeType, string> = {
  Article: 'Read article',
  Guide: 'Read guide',
  Checklist: 'Open checklist',
  Planner: 'Open planner',
  Calculator: 'Open calculator',
  Template: 'View template',
  Video: 'Watch video',
  Download: 'Get download',
}

function published(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// A result on Knowledge → Search (20/11/2026, the owner's design): the cover
// photo on top with the type and the first tag over it (no photo = a dark
// block with the type's icon), then category · reading time, title, a
// three-line summary and the publish date with the type's own verb. No
// bookmark (there are no favorites yet). A sibling of KnowledgeCoverCard.
export default function KnowledgeSearchCard({ article, categoryName, tagName }: Props) {
  const Icon = KNOWLEDGE_TYPE_ICONS[article.type]
  const tone = knowledgeCategoryLook(article.categorySlug).tone.split(' ')[1] ?? 'text-primary'
  const locked = article.access === 'members' || article.access === 'plan'
  const date = published(article.publishedAt)
  return (
    <Link
      to={`/knowledge/article/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-navy">
        {article.coverImage ? (
          <img src={article.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-navy via-navy to-primary/70">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white">
              <Icon size={26} strokeWidth={1.7} aria-hidden />
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1.5">
          <span className={`rounded-md px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white shadow-softer ${TYPE_BADGE[article.type]}`}>
            {article.type}
          </span>
          {tagName && <span className="truncate rounded-md bg-white/90 px-2 py-1 text-[10.5px] font-semibold text-navy/75 shadow-softer">{tagName}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        <p className="flex flex-wrap items-center gap-x-2 text-[12.5px]">
          {categoryName && <span className={`font-semibold ${tone}`}>{categoryName}</span>}
          {categoryName && <span className="text-navy/25" aria-hidden>•</span>}
          <span className="text-navy/45">{article.readingTimeMinutes} min read</span>
          {locked && (
            <span className="inline-flex items-center gap-1 text-navy/45">
              <Lock size={11} aria-hidden /> {article.access === 'plan' ? article.requiredPlan?.name ?? 'Plan' : 'Members'}
            </span>
          )}
          {article.language === 'pt' && <span className="text-navy/45">Português</span>}
        </p>
        <h3 className="mt-2 font-display text-[17px] font-bold leading-snug text-navy">{article.title}</h3>
        <div className="flex-1">
          <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-navy/55">{article.excerpt}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-navy/[0.06] px-5 py-3.5 text-[12.5px]">
        <span className="text-navy/40">{date && `Published ${date}`}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          {ACTION[article.type]} <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
