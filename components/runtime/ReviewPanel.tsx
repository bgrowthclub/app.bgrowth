import SectionHeader from '../ui/SectionHeader'
import TestimonialCard from '../systems/TestimonialCard'
import EmptyState from '../ui/EmptyState'
import type { SystemReview } from '../../types/system'

export default function ReviewPanel({ reviews }: { reviews: SystemReview[] }) {
  return (
    <div>
      <SectionHeader eyebrow="Customer Reviews" title="What people say" className="mb-8" />
      {reviews.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <TestimonialCard key={r.name} review={r} />
          ))}
        </div>
      ) : (
        <EmptyState title="No reviews yet." description="Be the first to complete this system and leave one." />
      )}
    </div>
  )
}
