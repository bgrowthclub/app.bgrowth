import { useRef, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  children: ReactNode
  className?: string
}

// Minimal, dependency-free horizontal scroll row — native scroll-snap plus
// two buttons that nudge scrollLeft, no carousel library. Generic and
// business-agnostic, so it lives in ui/ rather than platform/ or systems/.
export default function Carousel({ children, className = '' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollByAmount = (amount: number) => {
    trackRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div className={className}>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="mt-3 hidden justify-end gap-2 sm:flex">
        <button
          onClick={() => scrollByAmount(-320)}
          aria-label="Scroll left"
          className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-softer transition-colors hover:border-primary/20 hover:text-navy"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => scrollByAmount(320)}
          aria-label="Scroll right"
          className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-softer transition-colors hover:border-primary/20 hover:text-navy"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
