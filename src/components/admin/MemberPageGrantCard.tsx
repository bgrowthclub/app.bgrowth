import { useState } from 'react'
import { FileText } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON } from './styles'
import { adminService } from '../../modules/admin/adminService'

// Pages the team gives a member ON TOP of their plan (07/11/2026, Portal
// migration 0077). The owner's rule: Free gets one page, and the team may
// hand a Free or Starter member a second one — a promotion, a giveaway, a
// member who asked.
//
// Admin-only (the card is only rendered for a full admin) and written to
// Activity by the endpoint, like everything else the team gives away.
export default function MemberPageGrantCard({ userId, current }: { userId: string; current: number }) {
  const [value, setValue] = useState(String(current ?? 0))
  const [saved, setSaved] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shown = saved ?? current ?? 0
  const n = Math.round(Number(value))
  const valid = Number.isFinite(n) && n >= 0 && n <= 10
  const changed = valid && n !== shown

  const save = () => {
    if (!changed) return
    setBusy(true)
    setError(null)
    adminService
      .setMemberPageGrant(userId, n)
      .then((extra) => setSaved(extra))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Couldn’t save it.'))
      .finally(() => setBusy(false))
  }

  return (
    <section className={`${CARD} p-5`}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
        <FileText size={17} className="text-primary" aria-hidden />
        Extra business pages
      </h2>
      <p className="mt-1 text-[13px] text-navy/55">
        On top of what their plan gives. Their plan already includes its own; this is only what you are adding.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          className={`${INPUT} max-w-[110px]`}
          type="number"
          min={0}
          max={10}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Extra pages"
        />
        <Button type="button" onClick={save} disabled={!changed || busy} className={SMALL_BUTTON}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        {saved !== null && !changed && <span className="text-[13px] font-semibold text-emerald-600">Saved</span>}
      </div>

      {!valid && <p className="mt-2 text-[12.5px] text-red-500">A whole number from 0 to 10.</p>}
      {error && <p className="mt-2 text-[12.5px] text-red-500">{error}</p>}
    </section>
  )
}
