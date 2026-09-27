import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  slug: string
  name: string
  count?: number
  icon: LucideIcon
}

// One tile in the Knowledge Home's "Browse by Category" grid. The section's
// tenth tile ("More") renders separately as a plain link to the Knowledge
// Search page — see KnowledgeHomePage.tsx — not through this component,
// since it has no KnowledgeCategory record behind it.
export default function CategoryTile({ slug, name, count, icon: Icon }: Props) {
  return (
    <Link
      to={`/knowledge/category/${slug}`}
      className="group flex items-center gap-3.5 rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-softer transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bg-soft text-primary">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-navy">{name}</p>
        {count !== undefined && <p className="text-[11.5px] text-navy/40">{count} resources</p>}
      </div>
      <ArrowRight size={14} className="shrink-0 text-navy/25 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}
