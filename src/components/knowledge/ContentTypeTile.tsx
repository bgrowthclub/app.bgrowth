import { Link } from 'react-router-dom'
import type { KnowledgeType } from '../../modules/knowledge/types/knowledgeType'
import { KNOWLEDGE_TYPE_ICONS } from './knowledgeTypeIcons'

interface Props {
  type: KnowledgeType
  count?: number
}

// One tile in the Knowledge Home's "Browse by Content Type" grid — links
// into the Knowledge Search page pre-filtered to this type, so a future
// Studio-published type never needs a new destination page, only a new
// KnowledgeType value.
export default function ContentTypeTile({ type, count }: Props) {
  const Icon = KNOWLEDGE_TYPE_ICONS[type]

  return (
    <Link
      to={`/knowledge/search?type=${encodeURIComponent(type)}`}
      className="group flex flex-col items-center gap-3 rounded-xl3 border border-navy/[0.06] bg-white p-6 text-center shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-bg-soft text-primary transition-colors duration-300 group-hover:bg-grad-primary group-hover:text-white">
        <Icon size={21} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[13.5px] font-semibold text-navy">{type}</p>
        {count !== undefined && <p className="mt-0.5 text-[11.5px] text-navy/40">{count} resources</p>}
      </div>
    </Link>
  )
}
