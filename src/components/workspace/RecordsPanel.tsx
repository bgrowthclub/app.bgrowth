import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import Button from '../ui/Button'
import type { WorkspaceInstanceRow } from '../../modules/workspace/types/portal'
import { CARD, SMALL_BUTTON } from './styles'

interface Props {
  records: WorkspaceInstanceRow[]
  recordPath: (instanceId?: string) => string
  onNew: () => void
}

const VISIBLE = 5

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Shown above a Workspace's blank copy: explains "one record per client or
// job", starts a new one and lists the latest saved records, so they're
// found without opening the Records menu.
export default function RecordsPanel({ records, recordPath, onNew }: Props) {
  const latest = [...records]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, VISIBLE)

  return (
    <section className={`${CARD} no-print p-5 md:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="font-display text-[17px] font-bold text-navy">Your records</h2>
          <p className="mt-1 text-[13px] text-navy/55">
            Create one record for each client or job. Each record is saved on its own, so you can come back to it
            anytime.
          </p>
        </div>
        <Button type="button" onClick={onNew} className={SMALL_BUTTON}>
          <Plus className="h-4 w-4" />
          New record
        </Button>
      </div>

      {latest.length > 0 ? (
        <div className="mt-4 divide-y divide-navy/[0.06] rounded-xl border border-navy/[0.06]">
          {latest.map((record) => (
            <Link
              key={record.id}
              to={recordPath(record.id)}
              className="group flex items-center gap-3 px-4 py-3 hover:bg-bg-soft"
            >
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[14px] font-semibold text-navy">{record.label}</span>
                <span className="block text-[12px] text-navy/45">Updated {formatDate(record.updated_at)}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-navy/30 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-bg-soft px-4 py-3 text-[13px] text-navy/60">
          No records yet. Start your first one — for example, with your client&rsquo;s name.
        </p>
      )}

      {records.length > VISIBLE && (
        <Link to="/platform/documents" className="mt-3 inline-block text-[13px] font-semibold text-primary">
          See all {records.length} records in My Documents
        </Link>
      )}
    </section>
  )
}
