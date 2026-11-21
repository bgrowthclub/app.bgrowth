import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import Button from '../ui/Button'
import type { WorkspaceInstanceRow } from '../../modules/workspace/types/portal'
import { CARD, SMALL_BUTTON } from './styles'

interface Props {
  records: WorkspaceInstanceRow[]
  recordPath: (instanceId?: string) => string
  /** The Workspace's records page. */
  allPath: string
  onNew: () => void
}

const VISIBLE = 3

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Shown above a Workspace's blank copy (compact since 21/11/2026, so the
// Workspace starts higher on the screen): "one record per client or job",
// New record, and the latest saved records as small links — the Records menu
// and My Documents have them all.
export default function RecordsPanel({ records, recordPath, allPath, onNew }: Props) {
  const latest = [...records]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, VISIBLE)

  return (
    <section className={`${CARD} no-print px-5 py-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 basis-64 text-[13px] leading-snug text-navy/60">
          <span className="font-bold text-navy">Your records · </span>
          Create one record for each client or job — each one is saved on its own.
        </p>
        <Button type="button" onClick={onNew} className={SMALL_BUTTON}>
          <Plus className="h-4 w-4" />
          New record
        </Button>
      </div>

      {latest.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {latest.map((record) => (
            <Link
              key={record.id}
              to={recordPath(record.id)}
              title={`Updated ${formatDate(record.updated_at)}`}
              className="group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-navy/[0.08] px-3 py-1.5 text-[13px] font-semibold text-navy hover:border-primary/25 hover:bg-bg-soft"
            >
              <span className="truncate">{record.label}</span>
              <span className="shrink-0 text-[11.5px] font-normal text-navy/40">{formatDate(record.updated_at)}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-navy/30 group-hover:text-primary" />
            </Link>
          ))}
          <Link to={allPath} className="px-1 text-[13px] font-semibold text-primary hover:underline">
            See all records ({records.length})
          </Link>
        </div>
      )}
    </section>
  )
}
