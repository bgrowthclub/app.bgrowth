import { Link } from 'react-router-dom'
import type { AdminMemberDashboard } from '../../modules/admin/types'

type Item = AdminMemberDashboard['topWorkspaces'][number]

// The most used Workspaces in the period, as a ranked list with a bar for
// the number of members using each.
export default function TopWorkspacesList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-[13.5px] text-navy/45">No Workspace was opened or used in this period.</p>
  }
  const top = Math.max(...items.map((i) => i.members), 1)
  return (
    <ol className="space-y-4">
      {items.map((item, i) => (
        <li key={item.id} className="flex items-start gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-bg-soft text-[12.5px] font-bold text-primary">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              {item.slug ? (
                <Link to={`/product/${item.slug}`} className="min-w-0 break-words text-[13.5px] font-semibold text-navy hover:text-primary">
                  {item.name}
                </Link>
              ) : (
                <span className="min-w-0 break-words text-[13.5px] font-semibold text-navy">{item.name}</span>
              )}
              <span className="shrink-0 text-[13.5px] tabular-nums text-navy">
                <span className="font-semibold">{item.members}</span>
                <span className="ml-1 text-navy/45">{item.members === 1 ? 'member' : 'members'}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy/[0.05]">
              <div className="h-full rounded-full bg-primary/80" style={{ width: `${(item.members / top) * 100}%` }} />
            </div>
            <p className="mt-1 text-[12px] text-navy/45">
              {item.records} {item.records === 1 ? 'record' : 'records'} worked on · {item.newRecords} new
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
