import { KNOWLEDGE_TYPE_ICONS } from './knowledgeTypeIcons'
import type { KnowledgeType } from '../../modules/knowledge/types/knowledgeType'

export const KNOWLEDGE_TYPE_PLURAL: Record<KnowledgeType, string> = {
  Article: 'Articles',
  Guide: 'Guides',
  Checklist: 'Checklists',
  Planner: 'Planners',
  Calculator: 'Calculators',
  Template: 'Templates',
  Video: 'Videos',
  Download: 'Downloads',
}

interface Props {
  /** The types that have articles here (only these get a button). */
  types: KnowledgeType[]
  value: KnowledgeType | 'All'
  onChange: (value: KnowledgeType | 'All') => void
  /** How many match now — All and each type. */
  total: number
  countOf: (type: KnowledgeType) => number
  className?: string
}

// "All (n) · Articles (n) · Guides (n)…" on Knowledge → Search and a Knowledge
// category (20/11/2026, the owner's design). Nothing is drawn when there is
// only one type — a single button filters nothing.
export default function KnowledgeTypeFilter({ types, value, onChange, total, countOf, className = '' }: Props) {
  if (types.length < 2) return null
  const chip = (v: KnowledgeType | 'All', label: string, count: number) => {
    const active = value === v
    const Icon = v === 'All' ? null : KNOWLEDGE_TYPE_ICONS[v]
    return (
      <button
        key={v}
        type="button"
        onClick={() => onChange(v)}
        aria-pressed={active}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[13.5px] font-semibold transition-colors ${
          active ? 'border-primary bg-primary text-white shadow-softer' : 'border-navy/10 bg-white text-navy/70 hover:border-primary/25 hover:text-navy'
        }`}
      >
        {Icon && <Icon size={15} className={active ? 'text-white' : 'text-primary'} aria-hidden />}
        {label} <span className={active ? 'text-white/80' : 'text-navy/40'}>({count})</span>
      </button>
    )
  }
  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
      {chip('All', 'All', total)}
      {types.map((t) => chip(t, KNOWLEDGE_TYPE_PLURAL[t], countOf(t)))}
    </div>
  )
}
