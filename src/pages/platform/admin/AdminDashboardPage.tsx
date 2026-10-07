import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import AdminStatTile from '../../../components/admin/AdminStatTile'
import MemberFunnel from '../../../components/admin/MemberFunnel'
import SignupsChart from '../../../components/admin/SignupsChart'
import type { SignupPoint } from '../../../components/admin/SignupsChart'
import { CARD } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminMemberDashboard, DashboardPeriod } from '../../../modules/admin/types'

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
  { id: '365', label: 'Last 12 months' },
  { id: 'all', label: 'All time' },
]

// The views the Dashboard switches between. Members is built; the others
// come next (Sales still lives on its own page for now).
const VIEWS = [
  { id: 'members', label: 'Members' },
  { id: 'sales', label: 'Sales', to: '/platform/admin/sales' },
  { id: 'engagement', label: 'Engagement', soon: true },
] as const

const SELECT =
  'rounded-xl2 border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy shadow-softer outline-none focus:border-primary/30'
const TAB = 'rounded-full px-4 py-2 text-[13px] font-semibold transition-colors'

function toPoint(key: string, unit: AdminMemberDashboard['unit']): Pick<SignupPoint, 'label' | 'fullLabel'> {
  if (unit === 'month') {
    const [y, m] = key.split('-').map(Number)
    const d = new Date(y, m - 1, 1)
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }
  }
  const [y, m, day] = key.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  const short = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const long = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return { label: short, fullLabel: unit === 'week' ? `Week of ${long}` : long }
}

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—')

// Admin → Dashboard: numbers at a glance, one view at a time (Members now;
// Sales and Engagement next). Members: how many signed up, confirmed their
// e-mail, got a Workspace, used it and bought — for a period — plus where
// things stand today.
export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('30')
  const [data, setData] = useState<AdminMemberDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminService
      .getMemberDashboard(period)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Couldn’t load the dashboard.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [period])

  const points = useMemo<SignupPoint[]>(
    () => (data ? data.series.map((s) => ({ ...s, ...toPoint(s.key, data.unit) })) : []),
    [data],
  )
  const periodLabel = PERIODS.find((p) => p.id === period)?.label.toLowerCase() ?? ''

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Dashboard · Admin" description="BGrowth at a glance." path="/platform/admin/dashboard" />
      <SectionHeader eyebrow="Admin" title="Dashboard" description="BGrowth at a glance — pick what you want to see." className="mb-6" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dashboard view">
          {VIEWS.map((v) =>
            v.id === 'members' ? (
              <button key={v.id} type="button" role="tab" aria-selected className={`${TAB} bg-grad-primary text-white shadow-softer`}>
                {v.label}
              </button>
            ) : 'to' in v ? (
              <Link key={v.id} to={v.to} className={`${TAB} border border-navy/10 bg-white text-navy/60 hover:border-primary/20`}>
                {v.label}
              </Link>
            ) : (
              <span key={v.id} className={`${TAB} cursor-default border border-dashed border-navy/10 text-navy/35`} title="Coming soon">
                {v.label} · soon
              </span>
            ),
          )}
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value as DashboardPeriod)} className={`${SELECT} sm:ml-auto`} aria-label="Period">
          {PERIODS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {!data ? (
        error ? (
          <EmptyState icon={Users} title="We couldn’t load the dashboard." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {error && <p className="text-[14px] text-red-500">{error}</p>}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AdminStatTile label="Signed up" value={String(data.funnel.signedUp)} hint={periodLabel} />
            <AdminStatTile
              label="Confirmed e-mail"
              value={String(data.funnel.confirmed)}
              hint={`${pct(data.funnel.confirmed, data.funnel.signedUp)} of sign-ups`}
            />
            <AdminStatTile
              label="Started a trial"
              value={String(data.funnel.startedTrial)}
              hint={`${pct(data.funnel.startedTrial, data.funnel.signedUp)} of sign-ups`}
            />
            <AdminStatTile
              label="Trial → bought"
              value={String(data.funnel.trialToPaid)}
              hint={`${pct(data.funnel.trialToPaid, data.funnel.startedTrial)} of trials`}
            />
          </div>

          <section className={`${CARD} p-5`}>
            <h2 className="font-display text-lg font-bold text-navy">Sign-ups</h2>
            <p className="mb-4 mt-0.5 text-[13px] text-navy/45">
              Per {data.unit}, {periodLabel}. Darker part = confirmed their e-mail. Hover a bar for the numbers.
            </p>
            <SignupsChart points={points} />
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className={`${CARD} p-5`}>
              <h2 className="font-display text-lg font-bold text-navy">How far they got</h2>
              <p className="mb-5 mt-0.5 text-[13px] text-navy/45">People who signed up {periodLabel}, by the furthest step reached.</p>
              <MemberFunnel
                steps={[
                  { label: 'Signed up', hint: 'Created an account.', value: data.funnel.signedUp },
                  { label: 'Confirmed e-mail', hint: 'Clicked the link in the confirmation e-mail.', value: data.funnel.confirmed },
                  {
                    label: 'Got a Workspace',
                    hint: `Trial ${data.funnel.startedTrial} · free ${data.funnel.freeClaimed} · bought ${data.funnel.bought} · given by the team ${data.funnel.granted}`,
                    value: data.funnel.gotWorkspace,
                  },
                  { label: 'Used a Workspace', hint: 'Saved at least one record.', value: data.funnel.usedWorkspace },
                  { label: 'Bought', hint: 'Paid for at least one Workspace.', value: data.funnel.bought },
                ]}
              />
            </section>

            <section className={`${CARD} p-5`}>
              <h2 className="font-display text-lg font-bold text-navy">Today</h2>
              <p className="mb-4 mt-0.5 text-[13px] text-navy/45">All members right now — the team’s own accounts aren’t counted.</p>
              <ul className="divide-y divide-navy/[0.06]">
                {[
                  ['Members', data.snapshot.members],
                  ['Haven’t confirmed their e-mail', data.snapshot.unconfirmed],
                  ['Trials running', data.snapshot.trialsActive],
                  ['Trials ended without buying', data.snapshot.trialsEndedNotBought],
                  ['With access given by the team', data.snapshot.activeGrants],
                  ['Signed in in the last 7 days', data.snapshot.signedInLast7Days],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                    <span className="text-navy/65">{label}</span>
                    <span className="font-semibold tabular-nums text-navy">{value}</span>
                  </li>
                ))}
              </ul>
              <Link to="/platform/admin/members" className="mt-4 inline-block text-[13px] font-semibold text-primary hover:underline">
                See the members →
              </Link>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
