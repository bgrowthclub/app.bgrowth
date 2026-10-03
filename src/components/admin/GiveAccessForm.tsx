import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../ui/Button'
import type { AdminProduct } from '../../modules/admin/types'
import { CARD, INPUT, SMALL_BUTTON, endOfDayIso, todayInput } from './styles'

export interface GiveAccessValues {
  kind: 'grant' | 'purchase'
  scope: 'specific' | 'all'
  productId: string
  expiresAt: string | null
  note: string
}

interface Props {
  products: AdminProduct[]
  busy: boolean
  error: string | null
  // Set when the server asks for confirmation (an All Workspaces grant
  // already covers this Workspace) — submitting again confirms.
  warning: string | null
  onSubmit: (values: GiveAccessValues) => void
  onCancel: () => void
}

// Gives a member access by hand:
//  - Manual access: a grant (one Workspace or all), optionally until a date —
//    for partners, support, gifts;
//  - Purchase: records the Workspace as bought (never expires) — the same
//    write a real payment makes, e.g. for a sale made outside the site.
export default function GiveAccessForm({ products, busy, error, warning, onSubmit, onCancel }: Props) {
  const [kind, setKind] = useState<GiveAccessValues['kind']>('grant')
  const [scope, setScope] = useState<GiveAccessValues['scope']>('specific')
  const [productId, setProductId] = useState('')
  const [hasEnd, setHasEnd] = useState(false)
  const [endDate, setEndDate] = useState(todayInput(30))
  const [note, setNote] = useState('')

  const needsProduct = kind === 'purchase' || scope === 'specific'

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      kind,
      scope: kind === 'purchase' ? 'specific' : scope,
      productId,
      expiresAt: kind === 'grant' && hasEnd ? endOfDayIso(endDate) : null,
      note: note.trim(),
    })
  }

  return (
    <form onSubmit={submit} className={`${CARD} space-y-4 p-5`}>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['grant', 'Manual access'],
            ['purchase', 'Record a purchase'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              kind === value ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-[12.5px] leading-relaxed text-navy/50">
        {kind === 'grant'
          ? 'Opens Workspaces for this member without a payment — for partners, support or gifts. You can revoke it any time.'
          : 'Marks the Workspace as bought, with access that never expires — the same as a real payment. Use it for a sale made outside the site.'}
      </p>

      {kind === 'grant' && (
        <div className="flex flex-wrap gap-4 text-[13.5px] text-navy">
          <label className="flex items-center gap-2">
            <input type="radio" checked={scope === 'specific'} onChange={() => setScope('specific')} />
            One Workspace
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} />
            All Workspaces (including future ones)
          </label>
        </div>
      )}

      {needsProduct && (
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className={INPUT} required aria-label="Workspace">
          <option value="">Choose a Workspace…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {kind === 'grant' && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-navy">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hasEnd} onChange={(e) => setHasEnd(e.target.checked)} />
              Ends on a date
            </label>
            {hasEnd && (
              <input
                type="date"
                min={todayInput(1)}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${INPUT} !w-auto`}
                required
                aria-label="End date"
              />
            )}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — e.g. partner, support case"
            className={INPUT}
            maxLength={300}
          />
        </>
      )}

      {warning && <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-700">{warning}</p>}
      {error && <p className="text-[13px] text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy} className={SMALL_BUTTON}>
          {busy ? 'Saving…' : warning ? 'Add anyway' : kind === 'grant' ? 'Give access' : 'Record purchase'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className={SMALL_BUTTON}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
