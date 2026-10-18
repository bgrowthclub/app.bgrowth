import { useState } from 'react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON, endOfDayIso, todayInput } from './styles'
import type { AdminCouponDraft, AdminCouponsOverview } from '../../modules/admin/types'

interface Props {
  plans: AdminCouponsOverview['plans']
  onSave: (draft: AdminCouponDraft) => Promise<void>
  onCancel: () => void
}

const LABEL = 'text-[13px] font-semibold text-navy'

// A new coupon: the code people type, the discount, how long it lasts on a
// plan, what it applies to, and optional limits.
export default function CouponForm({ plans, onSave, onCancel }: Props) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState('20')
  const [duration, setDuration] = useState<AdminCouponDraft['duration']>('once')
  const [months, setMonths] = useState('3')
  const [scope, setScope] = useState<'all' | 'plans'>('all')
  const [planIds, setPlanIds] = useState<string[]>([])
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [expires, setExpires] = useState('')
  const [firstTimeOnly, setFirstTimeOnly] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        code,
        name,
        kind,
        value: Number(value),
        duration,
        months: duration === 'repeating' ? Number(months) : null,
        planIds: scope === 'plans' ? planIds : [],
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expiresAt: expires ? endOfDayIso(expires) : null,
        firstTimeOnly,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t create the coupon.')
      setSaving(false)
    }
  }

  return (
    <div className={`${CARD} space-y-5 p-6`}>
      <h2 className="font-display text-lg font-bold text-navy">New coupon</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Code people type</span>
          <input className={`${INPUT} mt-1 uppercase`} value={code} maxLength={40} placeholder="WELCOME20" onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))} />
        </label>
        <label className="block">
          <span className={LABEL}>Internal name (optional)</span>
          <input className={`${INPUT} mt-1`} value={name} maxLength={40} placeholder="e.g. Instagram giveaway Oct" onChange={(e) => setName(e.target.value)} />
        </label>
        <div>
          <span className={LABEL}>Discount</span>
          <div className="mt-1 flex gap-2">
            <select className={`${INPUT} max-w-[130px]`} value={kind} onChange={(e) => setKind(e.target.value as 'percent' | 'amount')}>
              <option value="percent">% off</option>
              <option value="amount">US$ off</option>
            </select>
            <input className={INPUT} type="number" min={1} max={kind === 'percent' ? 100 : undefined} step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        </div>
        <div>
          <span className={LABEL}>On a plan, the discount lasts</span>
          <div className="mt-1 flex gap-2">
            <select className={INPUT} value={duration} onChange={(e) => setDuration(e.target.value as AdminCouponDraft['duration'])}>
              <option value="once">First payment only</option>
              <option value="repeating">Some months</option>
              <option value="forever">Every payment</option>
            </select>
            {duration === 'repeating' && (
              <input className={`${INPUT} max-w-[90px]`} type="number" min={1} max={36} value={months} onChange={(e) => setMonths(e.target.value)} aria-label="Months" />
            )}
          </div>
          <span className="mt-1 block text-[12px] text-navy/40">Workspaces and bundles are paid once, so it applies once.</span>
        </div>
      </div>

      <div>
        <span className={LABEL}>Applies to</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ['all', 'Everything (plans, Workspaces, bundles)'],
              ['plans', 'Only some plans'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                scope === id ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {scope === 'plans' && (
          <div className="mt-3 space-y-2">
            {plans.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 text-[13.5px] text-navy">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  disabled={!p.product}
                  checked={planIds.includes(p.id)}
                  onChange={(e) => setPlanIds((ids) => (e.target.checked ? [...ids, p.id] : ids.filter((i) => i !== p.id)))}
                />
                {p.name}
                {!p.product && <span className="text-[12px] text-navy/40">— available after its first checkout</span>}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={LABEL}>Total uses (optional)</span>
          <input className={`${INPUT} mt-1`} type="number" min={1} value={maxRedemptions} placeholder="No limit" onChange={(e) => setMaxRedemptions(e.target.value)} />
        </label>
        <label className="block">
          <span className={LABEL}>Valid until (optional)</span>
          <input className={`${INPUT} mt-1`} type="date" min={todayInput(1)} value={expires} onChange={(e) => setExpires(e.target.value)} />
        </label>
        <label className="flex items-end gap-2.5 pb-3 text-[13.5px] text-navy">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={firstTimeOnly} onChange={(e) => setFirstTimeOnly(e.target.checked)} />
          Only for a first purchase
        </label>
      </div>

      {error && <p className="text-[13.5px] text-red-500">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className={SMALL_BUTTON}>
          Cancel
        </Button>
        <Button type="button" disabled={saving || !code || (scope === 'plans' && planIds.length === 0)} onClick={() => void save()} className={SMALL_BUTTON}>
          {saving ? 'Creating…' : 'Create coupon'}
        </Button>
      </div>
    </div>
  )
}
