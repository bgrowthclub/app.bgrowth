import StarRating from '../ui/StarRating'
import type { PortalReviewSummary } from '../../modules/workspace/types/portal'

// "★★★★½ 4.6 · 12 reviews" — nothing when there are no reviews yet.
export default function ReviewSummaryLine({ summary, href }: { summary: PortalReviewSummary; href?: string }) {
  if (summary.reviewCount === 0) return null
  const content = (
    <>
      <StarRating rating={summary.averageRating} />
      <span className="font-semibold text-navy">{summary.averageRating.toFixed(1)}</span>
      <span className="text-navy/45">
        · {summary.reviewCount} {summary.reviewCount === 1 ? 'review' : 'reviews'}
      </span>
    </>
  )
  return href ? (
    <a href={href} className="inline-flex items-center gap-2 text-[13.5px] hover:opacity-80">
      {content}
    </a>
  ) : (
    <span className="inline-flex items-center gap-2 text-[13.5px]">{content}</span>
  )
}
