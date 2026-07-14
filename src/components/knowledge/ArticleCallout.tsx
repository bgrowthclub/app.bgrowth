import { Lightbulb } from 'lucide-react'
import type { KnowledgeCalloutCard } from '../../modules/knowledge/types/article'

export default function ArticleCallout({ title, body }: KnowledgeCalloutCard) {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-primary/15 bg-bg-soft p-5">
      <Lightbulb size={18} className="mt-0.5 shrink-0 text-primary" strokeWidth={1.75} />
      <div>
        <p className="text-[13.5px] font-bold text-navy">{title}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-navy/60">{body}</p>
      </div>
    </div>
  )
}
