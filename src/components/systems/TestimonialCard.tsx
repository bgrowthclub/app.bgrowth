import { Star } from 'lucide-react'
import type { SystemReview } from '../../types/system'

export default function TestimonialCard({ review }: { review: SystemReview }) {
  return (
    <div className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
      <div className="flex gap-0.5 text-primary">
        {Array.from({ length: review.rating }).map((_, s) => (
          <Star key={s} size={14} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <p className="mt-4 text-[14.5px] leading-relaxed text-navy/70">“{review.quote}”</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-grad-primary font-display text-[13px] font-bold text-white">
          {review.name.charAt(0)}
        </div>
        <div>
          <p className="text-[13.5px] font-semibold text-navy">{review.name}</p>
          <p className="text-[12px] text-navy/40">{review.role}</p>
        </div>
      </div>
    </div>
  )
}
