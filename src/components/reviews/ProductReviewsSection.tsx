import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, PenLine } from 'lucide-react'
import Button from '../ui/Button'
import ReviewCard from './ReviewCard'
import ReviewSummaryLine from './ReviewSummaryLine'
import ReviewFormDialog from './ReviewFormDialog'
import type { ProductReviews } from '../../modules/workspace/hooks/useProductReviews'

interface Props {
  id: string
  workspaceName: string
  reviews: ProductReviews
  signedIn: boolean
  // Came from the "how is it going?" e-mail: open the form right away.
  requested: boolean
}

const BUTTON = '!rounded-xl !px-4 !py-2.5 !text-[13px]'

// A Studio product's reviews on its product page: the average, one review at
// a time with arrows, and — for a member who has it — writing or editing
// their own. Since 16/11/2026 (the owner's choice) the section only appears
// once there IS a review: an empty "No reviews yet" box made the page longer
// for nothing. The first review is invited inside the product and by e-mail;
// the e-mail's link (?review=1) still opens the form here.
export default function ProductReviewsSection({ id, workspaceName, reviews, signedIn, requested }: Props) {
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState(0)
  const { summary, mine, canReview, loading } = reviews

  useEffect(() => {
    if (!requested || loading) return
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (canReview && !mine) setOpen(true)
    // Only when the page first finishes loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, loading])

  if (loading) return null
  const askSignIn = requested && !signedIn
  const list = reviews.reviews
  const dialog = (
    <ReviewFormDialog
        open={open}
        workspaceName={workspaceName}
        initial={mine ? { rating: mine.rating, title: mine.title, comment: mine.comment } : undefined}
        onSubmit={reviews.submit}
        onClose={() => setOpen(false)}
      />
  )
  // No review yet: nothing on the page — only the form, when the e-mail asked.
  if (list.length === 0)
    return askSignIn ? (
      <section id={id} className="scroll-mt-24 flex flex-wrap items-center justify-between gap-3 rounded-xl3 border border-navy/[0.06] bg-white p-5 shadow-softer">
        <p className="text-[14px] text-navy/70">Sign in to tell others how {workspaceName} worked for you.</p>
        <Button to="/login" className={BUTTON}>
          Sign in to write your review
        </Button>
      </section>
    ) : (
      <span id={id}>{dialog}</span>
    )
  const i = Math.min(at, list.length - 1)

  return (
    <section id={id} className="scroll-mt-24 rounded-xl3 border border-navy/[0.06] bg-white p-5 shadow-softer md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-1 font-display text-[22px] font-bold text-navy">What members say</h2>
          <div className="mt-2">
            <ReviewSummaryLine summary={summary} />
          </div>
        </div>
        {canReview ? (
          <Button type="button" variant={mine ? 'secondary' : 'primary'} onClick={() => setOpen(true)} className={BUTTON}>
            <PenLine className="h-4 w-4" />
            {mine ? 'Edit your review' : 'Write a review'}
          </Button>
        ) : askSignIn ? (
          <Button to="/login" className={BUTTON}>
            Sign in to write your review
          </Button>
        ) : null}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <ReviewCard review={list[i]} />
        </div>
        {list.length > 1 && (
          <div className="flex shrink-0 flex-col items-center gap-2">
            <button type="button" aria-label="Previous review" title="Previous review" onClick={() => setAt((i - 1 + list.length) % list.length)} className="grid h-9 w-9 place-items-center rounded-full bg-bg-soft text-navy hover:bg-primary/10">
              <ChevronLeft size={18} />
            </button>
            <span className="text-[11.5px] text-navy/45">
              {i + 1}/{list.length}
            </span>
            <button type="button" aria-label="Next review" title="Next review" onClick={() => setAt((i + 1) % list.length)} className="grid h-9 w-9 place-items-center rounded-full bg-bg-soft text-navy hover:bg-primary/10">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      {dialog}
    </section>
  )
}
