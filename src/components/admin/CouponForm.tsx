import { useState } from 'react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON, endOfDayIso, todayInput } from './styles'
import type { AdminCouponDraft, AdminCouponsOverview } from '../../modules/admin/types'

interface Props {
  plans: AdminCouponsOverview['plans']
  items: AdminCouponsOverview['items']
  onSave: (draft: AdminCouponDraft) => Promise<void>
  onCancel: () => void
}

const LABEL = 'text-[13px] font-semibold text-navy'

// A new coupon: the code people type, the discount, how long it lasts on a
// plan, what it applies to, and optional limits.
const KIND: Record<string, string> = { workspace: 'Workspace', calculator: 'Calculator', pdf: 'Download', bundle: 'Bundle' }

export default function CouponForm({ plans, items, onSave, onCancel }: Props) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState('20')
  const [duration, setDuration] = useState<AdminCouponDraft['duration']>('once')
  const [months, setMonths] = useState('3')
  const [scope, setScope] = useState<'all' | 'some'>('all')
  const [planIds, setPlanIds] = useState<string[]>([])
  const [productIds, setProductIds] = useState<string[]>([])
  const [filter, setFilter] = useState('')
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
        planIds: scope === 'some' ? planIds : [],
        productIds: scope === 'some' ? productIds : [],
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
              ['some', 'Only what I choose'],
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
        {scope === 'some' && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-navy/40">Plans</p>
              <div className="space-y-2">
                {plans.length === 0 && <p className="text-[13px] text-navy/40">No paid plans.</p>}
                {plans.map((p) => (
                  <label key={p.id} className="flex items-center gap-2.5 text-[13.5px] text-navy">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={planIds.includes(p.id)}
                      onChange={(e) => setPlanIds((ids) => (e.target.checked ? [...ids, p.id] : ids.filter((i) => i !== p.id)))}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-navy/40">Workspaces &amp; bundles ({productIds.length})</p>
              <input className={`${INPUT} mb-2`} value={filter} placeholder="Search…" onChange={(e) => setFilter(e.target.value)} />
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {items
                  .filter((i) => !filter || i.name.toLowerCase().includes(filter.toLowerCase()))
                  .map((i) => (
                    <label key={i.id} className="flex items-center gap-2.5 text-[13.5px] text-navy">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={productIds.includes(i.id)}
                        onChange={(e) => setProductIds((ids) => (e.target.checked ? [...ids, i.id] : ids.filter((x) => x !== i.id)))}
                      />
                      <span className="flex-1">{i.name}</span>
                      <span className="text-[11.5px] text-navy/40">{KIND[i.kind] ?? i.kind}</span>
                    </label>
                  ))}
              </div>
            </div>
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
        <Button type="button" disabled={saving || !code || (scope === 'some' && planIds.length + productIds.length === 0)} onClick={() => void save()} className={SMALL_BUTTON}>
          {saving ? 'Creating…' : 'Create coupon'}
        </Button>
      </div>
    </div>
  )
}
