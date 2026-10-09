import { Link } from 'react-router-dom'
import type { AdminDeletionRequest } from '../../modules/admin/types'
import { LINK_BUTTON, formatDate, pillClass } from './styles'

interface Props {
  request: AdminDeletionRequest
  onComplete: () => void
  onReject: () => void
}

const STATUS = {
  pending: { label: 'Waiting', tone: 'amber' },
  completed: { label: 'Deleted', tone: 'gray' },
  cancelled: { label: 'Cancelled by member', tone: 'blue' },
  rejected: { label: 'Not completed', tone: 'red' },
} as const

const plural = (n: number | null, word: string) => (n === null ? `? ${word}s` : `${n} ${word}${n === 1 ? '' : 's'}`)

// One account deletion request in Admin → Deletions.
export default function AdminDeletionRow({ request: r, onComplete, onReject }: Props) {
  const status = STATUS[r.status]
  const pending = r.status === 'pending'
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className={pillClass(status.tone)}>{status.label}</span>
        <span className="text-[12px] text-navy/40">
          Asked {formatDate(r.requested_at)} · {r.source === 'portal' ? 'Portal' : 'Website'}
          {r.decided_at && !pending && ` · ${status.label.toLowerCase()} ${formatDate(r.decided_at)}`}
        </span>
        {pending && (
          <span className="ml-auto flex gap-1">
            <button type="button" onClick={onReject} className={`${LINK_BUTTON} text-navy/60 hover:bg-bg-soft`}>
              Not now…
            </button>
            <button type="button" onClick={onComplete} className={`${LINK_BUTTON} text-red-600 hover:bg-red-50`}>
              Delete account…
            </button>
          </span>
        )}
      </div>
      <p className="mt-2 break-words text-[14px] font-semibold text-navy">
        {r.user_id && pending ? (
          <Link to={`/platform/admin/members/${r.user_id}`} className="hover:text-primary">
            {r.full_name || r.email}
          </Link>
        ) : (
          (r.full_name || r.email) ?? 'Deleted member'
        )}
        {r.email && r.full_name && <span className="ml-2 font-normal text-navy/45">{r.email}</span>}
      </p>
      {r.reason && <p className="mt-1 whitespace-pre-line break-words text-[13.5px] text-navy/65">“{r.reason}”</p>}
      {pending && r.data && (
        <p className="mt-2 text-[12.5px] text-navy/45">
          Will delete: {plural(r.data.licenses, 'Workspace license')} · {plural(r.data.grants, 'access grant')} ·{' '}
          {plural(r.data.records, 'saved record')} · {plural(r.data.reviews, 'review')} ·{' '}
          {plural(r.data.conversations, 'support conversation')} · newsletter {r.data.newsletter ?? 'not subscribed'}
        </p>
      )}
      {r.admin_note && <p className="mt-2 text-[12.5px] text-navy/55">Note sent: {r.admin_note}</p>}
      {r.decided_by && !pending && r.decided_by !== 'member' && <p className="mt-1 text-[12px] text-navy/35">By {r.decided_by}</p>}
    </div>
  )
}
