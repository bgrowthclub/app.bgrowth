import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../ui/Button'
import StarRatingInput from '../ui/StarRatingInput'
import type { ReviewInput } from '../../modules/workspace/types/portal'

interface Props {
  open: boolean
  workspaceName: string
  initial?: ReviewInput
  onSubmit: (input: ReviewInput) => Promise<void>
  onClose: () => void
}

const INPUT =
  'mt-1.5 w-full rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
const BUTTON = '!rounded-xl !px-4 !py-2.5 !text-[13px]'

// Write or edit a review: stars, a short title and a comment — the same
// three fields as the Portal's review form.
export default function ReviewFormDialog({ open, workspaceName, initial, onSubmit, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    setRating(initial?.rating ?? 0)
    setTitle(initial?.title ?? '')
    setComment(initial?.comment ?? '')
    setError(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const ready = rating > 0 && title.trim().length > 0 && comment.trim().length > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ready) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ rating, title: title.trim().slice(0, 120), comment: comment.trim().slice(0, 2000) })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save your review. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl3 bg-white p-6 shadow-glow"
      >
        <h2 id="review-dialog-title" className="font-display text-lg font-bold text-navy">
          {initial ? 'Edit your review' : 'Write a review'}
        </h2>
        <p className="mt-1 break-words text-[13px] text-navy/50">{workspaceName}</p>

        <div className="mt-5">
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        <label htmlFor="review-title" className="mt-5 block text-sm font-medium text-navy/75">
          Title
        </label>
        <input
          id="review-title"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Very easy to use"
          className={INPUT}
        />

        <label htmlFor="review-comment" className="mt-4 block text-sm font-medium text-navy/75">
          Your review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          rows={4}
          maxLength={2000}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was your experience like?"
          className={`${INPUT} resize-y`}
        />
        <p className="mt-2 text-[12px] text-navy/40">Your review is public, shown with your profile name.</p>

        {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className={BUTTON}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !ready} className={BUTTON}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Submit review'}
          </Button>
        </div>
      </form>
    </div>
  )
}
