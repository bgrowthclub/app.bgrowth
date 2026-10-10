import { Link } from 'react-router-dom'
import { pillClass } from './styles'
import type { Tone } from './styles'
import type { AdminActivityArea, AdminActivityEntry } from '../../modules/admin/types'

export const ACTIVITY_AREAS: { id: AdminActivityArea; label: string; tone: Tone }[] = [
  { id: 'members', label: 'Members', tone: 'blue' },
  { id: 'support', label: 'Support', tone: 'green' },
  { id: 'catalog', label: 'Catalog', tone: 'amber' },
  { id: 'newsletter', label: 'Newsletter', tone: 'gray' },
  { id: 'reviews', label: 'Reviews', tone: 'gray' },
  { id: 'deletions', label: 'Deletions', tone: 'red' },
  { id: 'team', label: 'Team', tone: 'red' },
]

function when(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// One change in Admin → Activity: when, who, what, and on whom.
export default function AdminActivityRow({ entry }: { entry: AdminActivityEntry }) {
  const area = ACTIVITY_AREAS.find((a) => a.id === entry.area)
  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-1.5 px-5 py-4">
      <span className="w-40 shrink-0 text-[12.5px] text-navy/45">{when(entry.created_at)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-navy">{entry.summary}</p>
        <p className="mt-0.5 text-[12.5px] text-navy/45">
          by {entry.admin_email}
          {entry.target_user_id && (
            <>
              {' · '}
              <Link to={`/platform/admin/members/${entry.target_user_id}`} className="font-semibold text-primary hover:underline">
                {entry.target_user_email ?? 'member'}
              </Link>
            </>
          )}
          {entry.target_product_name && <> · {entry.target_product_name}</>}
        </p>
      </div>
      {area && <span className={pillClass(area.tone)}>{area.label}</span>}
    </div>
  )
}
