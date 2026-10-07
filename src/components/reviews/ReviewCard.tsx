import StarRating from '../ui/StarRating'
import type { PortalReviewRow } from '../../modules/workspace/types/portal'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// One member's review of a Workspace.
export default function ReviewCard({ review }: { review: PortalReviewRow }) {
  return (
    <article className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
      <div className="flex items-center justify-between gap-3">
        <StarRating rating={review.rating} />
        <span className="text-[12px] text-navy/40">{formatDate(review.created_at)}</span>
      </div>
      <p className="mt-4 break-words text-[15px] font-semibold text-navy">{review.title}</p>
      <p className="mt-1.5 whitespace-pre-line break-words text-[14px] leading-relaxed text-navy/65">{review.comment}</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-grad-primary font-display text-[12px] font-bold text-white">
          {review.display_name.charAt(0).toUpperCase()}
        </div>
        <p className="text-[13px] font-semibold text-navy">{review.display_name}</p>
      </div>
    </article>
  )
}
