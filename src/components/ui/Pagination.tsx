import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number // 1-indexed
  pageCount: number
  onChange: (page: number) => void
}

// The page numbers to draw: all of them up to 7, else the first, the last and
// the current one with its neighbours; 0 marks a gap ("…"), so many pages
// still fit a phone (20/11/2026).
function pages(page: number, count: number): number[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const keep = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count))
  if (page <= 3) [2, 3, 4].forEach((n) => keep.add(n))
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach((n) => keep.add(n))
  const sorted = [...keep].sort((a, b) => a - b)
  const out: number[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(0)
    out.push(n)
  })
  return out
}

// Generic, business-agnostic page-number control — any paginated grid
// (Knowledge Category page today) can reuse this instead of hand-rolling
// prev/next buttons.
export default function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-softer transition-colors hover:border-primary/20 hover:text-navy disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>

      {pages(page, pageCount).map((n, i) =>
        n === 0 ? (
          <span key={`gap-${i}`} className="w-5 text-center text-[13px] text-navy/35" aria-hidden>
            …
          </span>
        ) : (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold transition-colors ${
            n === page ? 'bg-grad-primary text-white shadow-softer' : 'border border-navy/10 bg-white text-navy/60 hover:border-primary/20'
          }`}
        >
          {n}
        </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-softer transition-colors hover:border-primary/20 hover:text-navy disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
