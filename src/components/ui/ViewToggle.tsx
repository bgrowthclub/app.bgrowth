import { LayoutGrid, List as ListIcon } from 'lucide-react'

export type CardView = 'grid' | 'list'

interface Props {
  value: CardView
  onChange: (view: CardView) => void
  className?: string
}

/**
 * Cards or list. Lifted out of MyBusinessSystemsPage on 07/11/2026, when
 * the owner asked for the same control in the Academy: the markup was
 * about to exist twice, which is exactly what CLAUDE.md §12 forbids. The
 * appearance is unchanged — this is the same control, in one place.
 *
 * Business-agnostic: it knows nothing about what is being listed.
 */
export default function ViewToggle({ value, onChange, className = '' }: Props) {
  return (
    <div className={`flex shrink-0 gap-1 rounded-xl border border-navy/10 bg-white p-1 shadow-softer ${className}`}>
      <button
        onClick={() => onChange('grid')}
        aria-label="Grid view"
        aria-pressed={value === 'grid'}
        className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
          value === 'grid' ? 'bg-bg-soft text-primary' : 'text-navy/40 hover:text-navy'
        }`}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        onClick={() => onChange('list')}
        aria-label="List view"
        aria-pressed={value === 'list'}
        className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
          value === 'list' ? 'bg-bg-soft text-primary' : 'text-navy/40 hover:text-navy'
        }`}
      >
        <ListIcon size={16} />
      </button>
    </div>
  )
}
