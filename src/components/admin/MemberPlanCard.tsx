import { useCallback, useEffect, useState } from 'react'
import { Crown, Plus } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON, endOfDayIso, formatDate, pillClass, todayInput } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminMemberPlan, AdminMemberPlans, MemberPlanReason } from '../../modules/admin/types'

const REASONS: { id: MemberPlanReason; label: string }[] = [
  { id: 'promotion', label: 'Promotion' },
  { id: 'giveaway', label: 'Giveaway' },
  { id: 'referral', label: 'Referral' },
  { id: 'support', label: 'Support (to fix a problem)' },
  { id: 'other', label: 'Other' },
]

function describe(row: AdminMemberPlan) {
  if (row.source === 'subscription') {
    return `Paid · ${row.billing_interval === 'year' ? 'yearly' : 'monthly'}${row.cancel_at_period_end ? ' · cancels at the end of the period' : ''}`
  }
  const reason = REASONS.find((r) => r.id === row.reason)?.label ?? 'Given by the team'
  return `Given by the team · ${reason}${row.note ? ` — ${row.note}` : ''}`
}

// Admin → one member → Plan: the plan they have now, paid or given by the
// team, and giving a better plan (promotion, giveaway, referral…) until a
// date or with no end. Portal migration 0057.
export default function MemberPlanCard({ userId }: { userId: string }) {
  const [data, setData] = useState<AdminMemberPlans | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [giving, setGiving] = useState(false)
  const [planId, setPlanId] = useState('')
  const [until, setUntil] = useState('')
  const [reason, setReason] = useState<MemberPlanReason>('promotion')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    adminService
      .getMemberPlans(userId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the plan.'))
  }, [userId])

  useEffect(load, [load])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      setGiving(false)
      setNote('')
      setUntil('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t change the plan.')
    } finally {
      setBusy(false)
    }
  }

  if (!data) return error ? <p className="text-[13px] text-red-500">{error}</p> : null
  if (!data.ready) return null

  const givable = data.plans.filter((p) => !p.is_free && p.status !== 'disabled')

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
          Plan <span className={pillClass(data.current === 'Free' ? 'gray' : 'green')}>{data.current}</span>
        </h2>
        {!giving && givable.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            icon={<Plus size={15} />}
            onClick={() => {
              setGiving(true)
              setPlanId(givable[givable.length - 1]?.id ?? '')
            }}
            className={SMALL_BUTTON}
          >
            Give a plan
          </Button>
        )}
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>}

      {giving && (
        <div className={`${CARD} mb-4 grid gap-4 p-5 sm:grid-cols-2`}>
          <label className="block">
            <span className="text-[13px] font-semibold text-navy">Plan</span>
            <select className={`${INPUT} mt-1`} value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {givable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.status === 'hidden' ? ' (hidden)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-navy">Until</span>
            <input className={`${INPUT} mt-1`} type="date" min={todayInput(1)} value={until} onChange={(e) => setUntil(e.target.value)} />
            <span className="mt-1 block text-[12px] text-navy/40">Empty = no end date.</span>
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-navy">Why</span>
            <select className={`${INPUT} mt-1`} value={reason} onChange={(e) => setReason(e.target.value as MemberPlanReason)}>
              {REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-navy">Note (optional)</span>
            <input className={`${INPUT} mt-1`} value={note} maxLength={300} placeholder="e.g. Instagram giveaway, Oct 2026" onChange={(e) => setNote(e.target.value)} />
          </label>
          <p className="text-[12px] text-navy/45 sm:col-span-2">
            If the member also pays for a plan, they get the higher of the two. Recorded in Admin → Activity.
          </p>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setGiving(false)} className={SMALL_BUTTON}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy || !planId}
              onClick={() =>
                void run(() => adminService.giveMemberPlan({ userId, planId, endsAt: until ? endOfDayIso(until) : null, reason, note }))
              }
              className={SMALL_BUTTON}
            >
              {busy ? 'Saving…' : 'Give plan'}
            </Button>
          </div>
        </div>
      )}

      {data.entries.length === 0 ? (
        !giving && (
          <p className={`${CARD} flex items-center gap-2 px-5 py-6 text-[13.5px] text-navy/45`}>
            <Crown size={15} /> On Free — no plan paid or given.
          </p>
        )
      ) : (
        <div className={`${CARD} divide-y divide-navy/[0.06]`}>
          {data.entries.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-navy">{row.membership_plans?.name ?? 'Plan'}</p>
                <p className="text-[12.5px] text-navy/45">
                  {describe(row)} · since {formatDate(row.starts_at)}
                  {row.ends_at ? ` · until ${formatDate(row.ends_at)}` : row.source === 'team' ? ' · no end date' : ''}
                </p>
              </div>
              <span className={pillClass(row.live ? 'green' : 'gray')}>{row.live ? 'Active' : 'Ended'}</span>
              {row.source === 'team' && row.live && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => window.confirm('End this plan now?') && void run(() => adminService.changeMemberPlan(row.id, 'end'))}
                  className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}
                >
                  End now
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
