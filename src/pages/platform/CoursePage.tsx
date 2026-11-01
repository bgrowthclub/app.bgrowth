import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import Button from '../../components/ui/Button'
import CourseRunner from '../../components/academy/CourseRunner'
import ReviewPrompt from '../../components/reviews/ReviewPrompt'
import NeedHelpButton from '../../components/platform/NeedHelpButton'
import { CARD } from '../../components/workspace/styles'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { useStudioWorkspace } from '../../modules/workspace/hooks/useStudioWorkspace'
import { useProductReviews } from '../../modules/workspace/hooks/useProductReviews'
import { isCourseContent } from '../../modules/academy/types'

// BGrowth Academy™ — one course, where the student reads it (31/10/2026).
// A course is a product like any other, so access, reviews and progress come
// from the same places every other product uses; what is different is where
// it opens. It has no named records: the student has one row, created the
// first time they tick a lesson.
export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useIdentity()
  const ws = useStudioWorkspace(slug, user?.id)
  const reviews = useProductReviews(
    ws.hasAccess ? ws.product?.id : undefined,
    user ? { id: user.id, displayName: user.displayName } : null,
    false,
  )

  if (!slug) return <Navigate to="/platform/academy" replace />
  if (ws.status === 'loading') return <p className="py-20 text-center text-[14px] text-navy/40">Loading the course…</p>
  if (ws.status === 'not-found') return <Navigate to="/platform/academy" replace />

  const product = ws.product
  if (!product) return <Navigate to="/platform/academy" replace />
  // Someone else's course, or one whose access ended.
  if (!ws.hasAccess) {
    return (
      <div className="mx-auto max-w-xl">
        <SEO title={product.name} description={product.short_description} path={`/platform/academy/${slug}`} />
        <div className={`${CARD} p-10 text-center`}>
          <Lock className="mx-auto h-7 w-7 text-navy/30" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-bold text-navy">{product.name}</h1>
          <p className="mt-2 text-[14px] text-navy/55">
            {ws.accessState === 'expired' ? 'Your access to this course has ended.' : 'You don’t have access to this course yet.'}
          </p>
          <Button to={`/product/${product.slug}`} className="mt-6">
            See the course
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title={product.name} description={product.short_description} path={`/platform/academy/${slug}`} />
      <Link to="/platform/academy" className="no-print inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" />
        Academy
      </Link>
      <h1 className="mt-2 break-words font-display text-2xl font-bold text-navy md:text-3xl">{product.name}</h1>

      <div className="mt-6">
        {isCourseContent(product.content) ? (
          <CourseRunner course={product.content} productId={product.id} userId={user?.id} records={ws.records} reloadRecords={ws.reloadRecords} />
        ) : (
          <p className={`${CARD} p-8 text-center text-[14px] text-navy/50`}>This course hasn&rsquo;t been published with its lessons yet.</p>
        )}
      </div>

      <div className="mt-6">
        <ReviewPrompt workspaceName={product.name} reviews={reviews} />
      </div>
      <NeedHelpButton about={product.name} className="mt-5" />
    </div>
  )
}
