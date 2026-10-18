import { useState } from 'react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON } from './styles'
import type { PlanSettings } from '../../modules/commerce/types/membership'

interface Props {
  settings: PlanSettings
  onSave: (settings: PlanSettings) => Promise<void>
}

// Admin → Plans → Settings: how subscriptions behave. Applies once plans
// are sold (step 2); each choice can be changed later.
export default function PlanSettingsForm({ settings, onSave }: Props) {
  const [draft, setDraft] = useState<PlanSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await onSave(draft)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`${CARD} space-y-5 p-6`}>
      <label className="block">
        <span className="text-[13px] font-semibold text-navy">Payments received through</span>
        <select className={`${INPUT} mt-1`} value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value as PlanSettings['provider'] })}>
          <option value="stripe">Stripe</option>
        </select>
        <span className="mt-1 block text-[12px] text-navy/40">Other payment companies can be added here later.</span>
      </label>
      <label className="block">
        <span className="text-[13px] font-semibold text-navy">When a member cancels</span>
        <select className={`${INPUT} mt-1`} value={draft.cancelAt} onChange={(e) => setDraft({ ...draft, cancelAt: e.target.value as PlanSettings['cancelAt'] })}>
          <option value="period_end">Keep the plan until the end of the period already paid</option>
          <option value="now">End the plan right away</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[13px] font-semibold text-navy">If a payment fails, keep the plan for (days)</span>
        <input
          className={`${INPUT} mt-1 max-w-[160px]`}
          type="number"
          min={0}
          max={30}
          value={draft.graceDays}
          onChange={(e) => setDraft({ ...draft, graceDays: Number(e.target.value) })}
        />
      </label>
      <label className="block">
        <span className="text-[13px] font-semibold text-navy">Suggested yearly discount (%)</span>
        <input
          className={`${INPUT} mt-1 max-w-[160px]`}
          type="number"
          min={0}
          max={100}
          value={draft.yearlyDiscountPercent}
          onChange={(e) => setDraft({ ...draft, yearlyDiscountPercent: Number(e.target.value) })}
        />
        <span className="mt-1 block text-[12px] text-navy/40">Used to suggest the yearly price when editing a plan.</span>
      </label>
      <label className="flex items-start gap-2.5 text-[13.5px] text-navy">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-primary"
          checked={draft.allowSwitch}
          onChange={(e) => setDraft({ ...draft, allowSwitch: e.target.checked })}
        />
        Members can change plan on their own (upgrade or downgrade)
      </label>
      {error && <p className="text-[13.5px] text-red-500">{error}</p>}
      {saved && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">Settings saved.</p>}
      <div className="flex justify-end">
        <Button type="button" disabled={saving} onClick={() => void save()} className={SMALL_BUTTON}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  )
}
