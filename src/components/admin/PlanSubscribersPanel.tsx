import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminStatTile from './AdminStatTile'
import { CARD, formatDate, pillClass } from './styles'
import type { Tone } from './styles'
import { formatCents } from '../../modules/workspace/lib/bundlePrice'
import { adminService } from '../../modules/admin/adminService'
import type { AdminPlanSubscriber, AdminPlanSubscribers } from '../../modules/admin/types'

function status(s: AdminPlanSubscriber): { label: string; tone: Tone } {
  if (!s.live) return { label: s.canceled_at ? `Cancelled · ${formatDate(s.canceled_at)}` : 'Ended', tone: 'gray' }
  if (s.status === 'past_due') return { label: 'Payment failed', tone: 'red' }
  if (s.cancel_at_period_end) return { label: `Ends ${formatDate(s.ends_at ?? s.current_period_end)}`, tone: 'amber' }
  return { label: `Renews ${formatDate(s.current_period_end)}`, tone: 'green' }
}

// Admin → Plans → Subscribers: paid subscriptions, monthly revenue and
// cancellations (Portal migration 0058).
export default function PlanSubscribersPanel() {
  const [data, setData] = useState<AdminPlanSubscribers | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEnded, setShowEnded] = useState(false)

  useEffect(() => {
    adminService
      .listPlanSubscribers()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the subscribers.'))
  }, [])

  if (!data) return error ? <p className="text-[14px] text-red-500">{error}</p> : <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
  if (!data.ready || !data.stats) {
    return <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">Run the database update (Portal migration 0058) to see subscribers.</p>
  }

  const list = data.subscribers.filter((s) => showEnded || s.live)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <AdminStatTile label="Paying members" value={String(data.stats.paying)} hint={data.stats.given ? `+ ${data.stats.given} given by the team` : undefined} />
        <AdminStatTile label="Monthly revenue" value={formatCents(data.stats.mrrCents)} hint="Yearly plans count 1/12" />
        <AdminStatTile label="Cancelling" value={String(data.stats.cancelling)} hint={data.stats.pastDue ? `${data.stats.pastDue} with a failed payment` : 'At the end of their period'} />
        <AdminStatTile label="Cancelled (30 days)" value={String(data.stats.canceled30)} />
      </div>

      <label className="flex items-center gap-2 text-[13px] text-navy/60">
        <input type="checkbox" className="h-4 w-4 accent-primary" checked={showEnded} onChange={(e) => setShowEnded(e.target.checked)} />
        Show ended subscriptions
      </label>

      {list.length === 0 ? (
        <p className={`${CARD} px-5 py-6 text-[13.5px] text-navy/45`}>No subscriptions yet.</p>
      ) : (
        <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
          {list.map((s) => {
            const st = status(s)
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-[200px] flex-1">
                  <Link to={`/platform/admin/members/${s.user_id}`} className="text-[13.5px] font-semibold text-navy hover:text-primary">
                    {s.name || s.email || 'Member'}
                  </Link>
                  <p className="text-[12px] text-navy/45">
                    {s.name && s.email ? `${s.email} · ` : ''}since {formatDate(s.starts_at)}
                  </p>
                </div>
                <span className="text-[13px] font-semibold text-navy">
                  {s.plan_name}
                  {s.amount_cents != null && (
                    <span className="font-normal text-navy/50"> · {formatCents(s.amount_cents)}/{s.billing_interval === 'year' ? 'yr' : 'mo'}</span>
                  )}
                </span>
                <span className={pillClass(st.tone)}>{st.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
