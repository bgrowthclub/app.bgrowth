import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../ui/Button'
import type { SupportHours } from '../../modules/support/types'
import { SUPPORT_TIMEZONES, WEEKDAY_LABELS } from '../../modules/support/hours'
import { INPUT, SMALL_BUTTON } from './styles'

interface Props {
  hours: SupportHours
  busy: boolean
  error: string | null
  onSave: (hours: SupportHours) => void
  onCancel: () => void
}

// Edits the support hours: during them the member's Support page is a live
// chat, outside them it becomes a ticket answered on the next business day.
export default function SupportHoursForm({ hours, busy, error, onSave, onCancel }: Props) {
  const [timezone, setTimezone] = useState(hours.timezone)
  const [days, setDays] = useState<number[]>(hours.days)
  const [start, setStart] = useState(hours.start)
  const [end, setEnd] = useState(hours.end)

  function toggle(day: number) {
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day].sort()))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    onSave({ timezone, days, start, end })
  }

  const zones = SUPPORT_TIMEZONES.some((z) => z.id === timezone)
    ? SUPPORT_TIMEZONES
    : [{ id: timezone, label: timezone }, ...SUPPORT_TIMEZONES]

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="mb-2 text-[12.5px] font-semibold text-navy/60">Days</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, day) => (
            <button
              key={label}
              type="button"
              onClick={() => toggle(day)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                days.includes(day) ? 'bg-primary text-white' : 'bg-bg-soft text-navy/55 hover:text-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col text-[12.5px] font-semibold text-navy/60">
          Opens
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`${INPUT} mt-1 !w-36`} required />
        </label>
        <label className="flex flex-col text-[12.5px] font-semibold text-navy/60">
          Closes
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`${INPUT} mt-1 !w-36`} required />
        </label>
        <label className="flex min-w-[220px] flex-1 flex-col text-[12.5px] font-semibold text-navy/60">
          Time zone
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={`${INPUT} mt-1`}>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className={SMALL_BUTTON}>
          {busy ? 'Saving…' : 'Save hours'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className={SMALL_BUTTON}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
