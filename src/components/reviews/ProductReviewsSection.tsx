import { useEffect, useState } from 'react'
import { PenLine } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
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

const PAGE = 6
const BUTTON = '!rounded-xl !px-4 !py-2.5 !text-[13px]'

// A Studio Workspace's reviews on its product page: the average, the
// reviews themselves, and — for a member who has it — writing or editing
// their own. Hidden while there's nothing to show and nothing to do.
export default function ProductReviewsSection({ id, workspaceName, reviews, signedIn, requested }: Props) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(PAGE)
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
  if (reviews.reviews.length === 0 && !canReview && !askSignIn) return null

  return (
    <section id={id} className="section-py scroll-mt-24">
      <div className="container-px mx-auto max-w-page">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionHeader eyebrow="Reviews" title="What members say" />
            <div className="mt-3">
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

        {reviews.reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet."
            description={canReview ? 'Be the first to tell others how this Workspace worked for you.' : 'Sign in to be the first to review it.'}
          />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.reviews.slice(0, visible).map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
            {reviews.reviews.length > visible && (
              <div className="mt-8 text-center">
                <Button type="button" variant="secondary" onClick={() => setVisible((n) => n + PAGE)} className={BUTTON}>
                  Show more reviews
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ReviewFormDialog
        open={open}
        workspaceName={workspaceName}
        initial={mine ? { rating: mine.rating, title: mine.title, comment: mine.comment } : undefined}
        onSubmit={reviews.submit}
        onClose={() => setOpen(false)}
      />
    </section>
  )
}
