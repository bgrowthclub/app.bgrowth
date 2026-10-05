import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { StudioDocument } from '../../modules/workspace/services/studioDocuments'
import { CARD } from './styles'

interface Props {
  document: StudioDocument
  to: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// One saved record in My Documents — name, progress, last update; opens it.
export default function DocumentCard({ document, to }: Props) {
  return (
    <Link
      to={to}
      className={`${CARD} group flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-glow`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words font-display text-[15px] font-bold text-navy">{document.label}</p>
        <ArrowRight className="h-4 w-4 shrink-0 text-navy/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/10">
          <div className="h-full rounded-full bg-grad-primary" style={{ width: `${document.percent}%` }} />
        </div>
        <span className="text-[12px] font-semibold text-navy/60">{document.percent}%</span>
      </div>
      <p className="mt-3 text-[12px] text-navy/45">Last updated {formatDate(document.updatedAt)}</p>
    </Link>
  )
}
