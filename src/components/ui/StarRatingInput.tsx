import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange: (value: number) => void
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

// Pick 1–5 stars. Keyboard: each star is its own radio button.
export default function StarRatingInput({ value, onChange }: Props) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Star size={28} strokeWidth={0} fill="currentColor" className={shown >= n ? 'text-primary' : 'text-navy/15'} />
          </button>
        ))}
      </div>
      {shown > 0 && <span className="text-[13px] font-medium text-navy/55">{LABELS[shown]}</span>}
    </div>
  )
}
