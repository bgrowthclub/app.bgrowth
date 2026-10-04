import type { AdminCategory } from '../../modules/admin/types'
import { INPUT } from './styles'

interface Props {
  categories: AdminCategory[]
  value: string | null
  onChange: (categoryId: string | null) => void
  disabled?: boolean
  className?: string
}

// One Workspace's category: an Area by itself ("General") or a category
// inside it — grouped by Area, the same list Studio shows.
export default function CategorySelect({ categories, value, onChange, disabled, className = '' }: Props) {
  const areas = categories.filter((c) => !c.parent_id)
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      className={`${INPUT} !py-2 ${className}`}
    >
      <option value="">No category</option>
      {areas.map((area) => (
        <optgroup key={area.id} label={area.name}>
          <option value={area.id}>{area.name} — general</option>
          {categories
            .filter((c) => c.parent_id === area.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}
