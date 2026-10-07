import { Link } from 'react-router-dom'
import StarRating from '../ui/StarRating'
import type { AdminReview } from '../../modules/admin/types'
import { LINK_BUTTON, formatDate, pillClass } from './styles'

interface Props {
  review: AdminReview
  onRemove: () => void
}

const FROM = {
  trial: { label: 'After trial', tone: 'amber' },
  purchase: { label: 'After purchase', tone: 'green' },
  access: { label: 'Given access', tone: 'blue' },
} as const

// One review in Admin → Reviews: what it says, who wrote it, about which
// Workspace — and removing it.
export default function AdminReviewRow({ review, onRemove }: Props) {
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <StarRating rating={review.rating} />
        <span className={pillClass(FROM[review.created_from].tone)}>{FROM[review.created_from].label}</span>
        <span className="text-[12px] text-navy/40">{formatDate(review.created_at)}</span>
        <button type="button" onClick={onRemove} className={`${LINK_BUTTON} ml-auto text-red-600 hover:bg-red-50`}>
          Remove
        </button>
      </div>
      <p className="mt-2 break-words text-[14px] font-semibold text-navy">{review.title}</p>
      <p className="mt-1 whitespace-pre-line break-words text-[13.5px] leading-relaxed text-navy/65">{review.comment}</p>
      <p className="mt-2 break-words text-[12.5px] text-navy/45">
        <Link to={`/platform/admin/members/${review.user_id}`} className="font-semibold text-primary hover:underline">
          {review.display_name}
        </Link>
        {review.email && <> · {review.email}</>} ·{' '}
        {review.product_slug ? (
          <Link to={`/product/${review.product_slug}#reviews`} className="hover:underline">
            {review.product_name}
          </Link>
        ) : (
          review.product_name
        )}
      </p>
    </div>
  )
}
