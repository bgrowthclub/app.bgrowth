import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../ui/Button'
import { INPUT, SMALL_BUTTON } from './styles'

interface Props {
  open: boolean
  submitting: boolean
  error: string | null
  onSubmit: (label: string) => void
  onCancel: () => void
}

// Names a new saved record of a Workspace (e.g. one per client or job).
export default function NewRecordDialog({ open, submitting, error, onSubmit, onCancel }: Props) {
  const [label, setLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel

  useEffect(() => {
    if (!open) return
    setLabel('')
    requestAnimationFrame(() => inputRef.current?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (label.trim()) onSubmit(label.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-record-title"
        className="relative w-full max-w-md rounded-xl3 bg-white p-6 shadow-glow"
      >
        <h2 id="new-record-title" className="font-display text-lg font-bold text-navy">
          New record
        </h2>
        <p className="mt-1 text-[13px] text-navy/50">
          Give it a name — a client, a job or a date — so you can find it again.
        </p>
        <label htmlFor="new-record-label" className="mt-5 block text-sm font-medium text-navy/75">
          Name
        </label>
        <input
          ref={inputRef}
          id="new-record-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. John Smith"
          className={`${INPUT} mt-1.5`}
        />
        {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} className={SMALL_BUTTON}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !label.trim()} className={SMALL_BUTTON}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
