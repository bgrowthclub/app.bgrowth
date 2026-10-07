import { useState } from 'react'
import { Star } from 'lucide-react'
import Button from '../ui/Button'
import StarRating from '../ui/StarRating'
import ReviewFormDialog from './ReviewFormDialog'
import type { ProductReviews } from '../../modules/workspace/hooks/useProductReviews'

interface Props {
  workspaceName: string
  reviews: ProductReviews
}

const BUTTON = '!rounded-xl !px-4 !py-2 !text-[13px]'

// Inside a Workspace: a small "How is it working for you?" invitation, or
// the member's own stars with "Edit review" once they've written one.
// Only for members who can review it (they hold a license).
export default function ReviewPrompt({ workspaceName, reviews }: Props) {
  const [open, setOpen] = useState(false)
  const [thanks, setThanks] = useState(false)
  const { mine, canReview, loading } = reviews
  if (loading || !canReview) return null

  return (
    <section className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl3 border border-navy/[0.06] bg-white px-5 py-4 shadow-softer">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg-soft text-primary">
          <Star size={17} />
        </span>
        {mine ? (
          <span className="flex flex-wrap items-center gap-2 text-[13.5px] text-navy/70">
            {thanks ? 'Thanks for your review!' : 'Your review'}
            <StarRating rating={mine.rating} />
          </span>
        ) : (
          <span className="text-[13.5px] text-navy/70">How is this Workspace working for you? Your review helps other members.</span>
        )}
      </div>
      <Button type="button" variant={mine ? 'secondary' : 'primary'} onClick={() => setOpen(true)} className={BUTTON}>
        {mine ? 'Edit review' : 'Write a review'}
      </Button>
      <ReviewFormDialog
        open={open}
        workspaceName={workspaceName}
        initial={mine ? { rating: mine.rating, title: mine.title, comment: mine.comment } : undefined}
        onSubmit={async (input) => {
          await reviews.submit(input)
          setThanks(true)
        }}
        onClose={() => setOpen(false)}
      />
    </section>
  )
}
