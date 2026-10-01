import { Link } from 'react-router-dom'
import { ChevronDown, FileText, Plus } from 'lucide-react'
import Popover from '../platform/Popover'
import type { WorkspaceInstanceRow } from '../../modules/workspace/types/portal'

interface Props {
  records: WorkspaceInstanceRow[]
  currentId: string | null
  recordPath: (instanceId?: string) => string
  onNew: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Lists a member's saved records of this Workspace and starts a new one.
export default function RecordSwitcher({ records, currentId, recordPath, onNew }: Props) {
  const current = records.find((r) => r.id === currentId)

  return (
    <Popover
      align="right"
      panelClassName="w-72 p-1.5"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[13px] font-semibold text-navy shadow-softer hover:border-primary/20"
        >
          <FileText className="h-4 w-4 text-primary" />
          <span className="max-w-[160px] truncate">{current ? current.label : 'Records'}</span>
          <span className="rounded-full bg-bg-soft px-2 py-0.5 text-[11px] text-primary">{records.length}</span>
          <ChevronDown className="h-3.5 w-3.5 text-navy/40" />
        </button>
      )}
    >
      <button
        type="button"
        onClick={onNew}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-primary hover:bg-bg-soft"
      >
        <Plus className="h-4 w-4" />
        New record
      </button>
      {records.length > 0 && <div className="my-1 h-px bg-navy/[0.06]" />}
      <div className="max-h-72 overflow-y-auto">
        {records.map((record) => (
          <Link
            key={record.id}
            to={recordPath(record.id)}
            className={`flex flex-col rounded-lg px-3 py-2.5 hover:bg-bg-soft ${record.id === currentId ? 'bg-bg-soft' : ''}`}
          >
            <span className="truncate text-[13px] font-semibold text-navy">{record.label}</span>
            <span className="text-[12px] text-navy/45">Updated {formatDate(record.updated_at)}</span>
          </Link>
        ))}
      </div>
      {currentId && (
        <>
          <div className="my-1 h-px bg-navy/[0.06]" />
          <Link to={recordPath()} className="block rounded-lg px-3 py-2.5 text-[13px] text-navy/60 hover:bg-bg-soft">
            Blank copy (not saved)
          </Link>
        </>
      )}
    </Popover>
  )
}
