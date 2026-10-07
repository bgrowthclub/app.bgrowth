import { Star } from 'lucide-react'

interface Props {
  rating: number // 0–5, may be fractional (an average)
  size?: number
  className?: string
}

// Five stars, filled to the nearest half — read-only.
export default function StarRating({ rating, size = 14, className = '' }: Props) {
  const rounded = Math.round(rating * 2) / 2
  return (
    <span className={`inline-flex gap-0.5 text-primary ${className}`} aria-label={`${rating.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = rounded >= n ? 1 : rounded >= n - 0.5 ? 0.5 : 0
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-navy/15" fill="currentColor" strokeWidth={0} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: size * fill }}>
                <Star size={size} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}
