import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number // 1-indexed
  pageCount: number
  onChange: (page: number) => void
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

      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
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
      ))}

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
