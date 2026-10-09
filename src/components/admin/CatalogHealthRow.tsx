import { Link } from 'react-router-dom'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { AdminCatalogWorkspace } from '../../modules/admin/types'
import { formatDate, pillClass } from './styles'

// One published Workspace in Admin → Catalog: what's wrong with it (if
// anything) and how much it's used.
export default function CatalogHealthRow({ workspace: w }: { workspace: AdminCatalogWorkspace }) {
  const problems = w.issues.filter((i) => i.level === 'problem')
  const warnings = w.issues.filter((i) => i.level === 'warning')
  const u = w.usage
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Link to={`/product/${w.slug}`} className="min-w-0 break-words text-[14px] font-semibold text-navy hover:text-primary">
          {w.name}
        </Link>
        {problems.length > 0 ? (
          <span className={pillClass('red')}>{problems.length === 1 ? '1 problem' : `${problems.length} problems`}</span>
        ) : warnings.length > 0 ? (
          <span className={pillClass('amber')}>{warnings.length === 1 ? '1 warning' : `${warnings.length} warnings`}</span>
        ) : (
          <span className={pillClass('green')}>All good</span>
        )}
        <span className="ml-auto text-[12px] text-navy/40">
          {w.steps} {w.steps === 1 ? 'step' : 'steps'} · published {formatDate(w.lastPublishedAt)}
        </span>
      </div>
      {w.issues.length > 0 && (
        <ul className="mt-2 space-y-1">
          {w.issues.map((issue) => (
            <li key={issue.text} className="flex items-start gap-2 text-[13px]">
              {issue.level === 'problem' ? (
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
              ) : (
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
              )}
              <span className={issue.level === 'problem' ? 'text-navy/80' : 'text-navy/60'}>{issue.text}</span>
            </li>
          ))}
        </ul>
      )}
      {w.issues.length === 0 && (
        <p className="mt-1 flex items-center gap-2 text-[13px] text-navy/50">
          <CheckCircle2 size={15} className="text-emerald-500" /> Ready to sell, with a complete page.
        </p>
      )}
      <p className="mt-2 text-[12.5px] text-navy/45">
        {u.purchases} {u.purchases === 1 ? 'purchase' : 'purchases'} · {u.trials} {u.trials === 1 ? 'trial' : 'trials'} · {u.records}{' '}
        {u.records === 1 ? 'saved record' : 'saved records'} · {u.reviews ? `${u.rating?.toFixed(1)} ★ (${u.reviews})` : 'no reviews'}
      </p>
    </div>
  )
}
