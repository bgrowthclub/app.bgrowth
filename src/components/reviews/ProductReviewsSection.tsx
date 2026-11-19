import { useEffect, useState } from 'react'
import { PenLine } from 'lucide-react'
import Button from '../ui/Button'
import ReviewCard from './ReviewCard'
import ReviewSummaryLine from './ReviewSummaryLine'
import ReviewFormDialog from './ReviewFormDialog'
import type { ProductReviews } from '../../modules/workspace/hooks/useProductReviews'

interface Props {
  // Replaces the section's own card look (the product page shows it inside a tab).
  className?: string
  id: string
  workspaceName: string
  reviews: ProductReviews
  signedIn: boolean
  // Came from the "how is it going?" e-mail: open the form right away.
  requested: boolean
}

const BUTTON = '!rounded-xl !px-4 !py-2.5 !text-[13px]'

// A Studio product's reviews on its product page: the average, up to three
// reviews side by side (one at a time with arrows until 19/11/2026), and — for a member who has it — writing or editing
// their own. Since 16/11/2026 (the owner's choice) the section only appears
// once there IS a review: an empty "No reviews yet" box made the page longer
// for nothing. The first review is invited inside the product and by e-mail;
// the e-mail's link (?review=1) still opens the form here.
export default function ProductReviewsSection({ id, workspaceName, reviews, signedIn, requested, className }: Props) {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(3)
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
  return (
    <section id={id} className={className ?? 'scroll-mt-24 rounded-xl3 border border-navy/[0.06] bg-white p-5 shadow-softer md:p-7'}>
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
      {/* 19/11/2026, the owner's design: up to three cards side by side; more
          with "Show more reviews". */}
      <div className={`mt-6 grid gap-5 ${list.length === 1 ? 'max-w-2xl' : list.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
        {list.slice(0, shown).map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
      {list.length > shown && (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setShown((n) => n + 3)} className="rounded-xl border border-navy/10 bg-white px-5 py-2.5 text-[13.5px] font-semibold text-navy shadow-softer hover:border-primary/25 hover:text-primary">
            Show more reviews ({list.length - shown})
          </button>
        </div>
      )}
      {dialog}
    </section>
  )
}
