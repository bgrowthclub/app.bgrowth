import { BadgeCheck, Quote } from 'lucide-react'
import StarRating from '../ui/StarRating'
import type { PortalReviewRow } from '../../modules/workspace/types/portal'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// How the reviewer had the product — always true: only someone with it may
// write a review (Portal migrations 0009/0037).
const SOURCE: Record<PortalReviewRow['created_from'], string> = {
  purchase: 'Verified purchase',
  trial: 'Reviewed during a free trial',
  access: 'Verified access',
}

// One member's review of a product (19/11/2026, the owner's testimonials
// design): quote mark, stars and rating, the title in bold quotes, the words,
// then the initials, the name and how they had the product.
export default function ReviewCard({ review }: { review: PortalReviewRow }) {
  const initials = review.display_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
  return (
    <article className="flex h-full flex-col rounded-[20px] border border-navy/[0.07] bg-white p-6 shadow-softer">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Quote size={18} aria-hidden />
        </span>
        <span className="text-[12px] text-navy/40">{formatDate(review.created_at)}</span>
      </div>
      <p className="mt-4 flex items-center gap-2">
        <StarRating rating={review.rating} />
        <span className="text-[11px] font-bold uppercase tracking-wide text-navy/40">{review.rating.toFixed(1)}</span>
      </p>
      {review.title && <p className="mt-3 break-words font-display text-[16.5px] font-bold leading-snug text-navy">“{review.title}”</p>}
      <p className="mt-2 flex-1 whitespace-pre-line break-words text-[14.5px] leading-relaxed text-navy/65">{review.comment}</p>
      <div className="mt-5 flex items-center gap-3 border-t border-navy/[0.07] pt-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-grad-primary font-display text-[13px] font-bold text-white" aria-hidden>
          {initials || '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-navy">{review.display_name}</p>
          <p className="inline-flex items-center gap-1 text-[12px] text-navy/50">
            <BadgeCheck size={13} className="text-primary" aria-hidden /> {SOURCE[review.created_from] ?? 'Verified access'}
          </p>
        </div>
      </div>
    </article>
  )
}
