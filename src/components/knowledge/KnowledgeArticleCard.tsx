import { ArrowUpRight, Clock } from 'lucide-react'
import type { KnowledgeArticle } from '../../types/knowledge'

// Card links to "#" for now — there's no article detail route yet. Swapping
// this for `/knowledge/${article.slug}` is a one-line change once that page
// exists; the slug is already on the mock data for that reason.
export default function KnowledgeArticleCard({ article }: { article: KnowledgeArticle }) {
  const Icon = article.icon
  return (
    <a
      href="#"
      className="group flex flex-col overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="grid h-40 place-items-center bg-bg-soft">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
          <Icon size={24} strokeWidth={2} aria-hidden="true" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span className="w-fit rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
          {article.category}
        </span>
        <h3 className="mt-4 font-display text-[16px] font-bold leading-snug text-navy">{article.title}</h3>
        <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-navy/50">{article.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-navy/40">
            <Clock size={12} aria-hidden="true" />
            {article.readTime}
          </span>
          <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary">
            Read Article
            <ArrowUpRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </a>
  )
}
