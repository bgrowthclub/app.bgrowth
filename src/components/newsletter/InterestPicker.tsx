import { Check } from 'lucide-react'
import { GROWTH_CATEGORIES, type GrowthCategoryId } from '../../types/growth'

interface Props {
  value: GrowthCategoryId[]
  onChange: (value: GrowthCategoryId[]) => void
  disabled?: boolean
}

// The areas a subscriber wants news about. Nothing picked = every area.
export default function InterestPicker({ value, onChange, disabled }: Props) {
  const toggle = (id: GrowthCategoryId) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors disabled:opacity-50 ${
      active ? 'border-primary bg-primary text-white' : 'border-navy/10 bg-white text-navy/70 hover:border-primary/30'
    }`

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={disabled} aria-pressed={value.length === 0} onClick={() => onChange([])} className={chip(value.length === 0)}>
        {value.length === 0 && <Check size={14} />}
        All topics
      </button>
      {GROWTH_CATEGORIES.map((area) => {
        const active = value.includes(area.id)
        return (
          <button key={area.id} type="button" disabled={disabled} aria-pressed={active} onClick={() => toggle(area.id)} className={chip(active)}>
            {active && <Check size={14} />}
            {area.label}
          </button>
        )
      })}
    </div>
  )
}
