import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'

interface Props {
  open: boolean
  busy: boolean
  error: string | null
  onSubmit: (reason: string) => void
  onCancel: () => void
}

const INPUT =
  'mt-1.5 w-full rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
const BUTTON = '!rounded-xl !px-4 !py-2.5 !text-[13px]'
const WORD = 'DELETE'

// Confirms a request to delete the account: optional reason, and typing
// DELETE so it can't happen by accident.
export default function DeleteAccountDialog({ open, busy, error, onSubmit, onCancel }: Props) {
  const [reason, setReason] = useState('')
  const [typed, setTyped] = useState('')
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel

  useEffect(() => {
    if (!open) return
    setReason('')
    setTyped('')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const ready = typed.trim().toUpperCase() === WORD

  function submit(e: FormEvent) {
    e.preventDefault()
    if (ready && !busy) onSubmit(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl3 bg-white p-6 shadow-glow"
      >
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h2 id="delete-account-title" className="font-display text-lg font-bold text-navy">
              Delete your account?
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-navy/60">
              Your account, Workspaces, saved records, reviews, support conversations and newsletter subscription will be
              deleted for good. Purchases can’t be recovered afterwards.
            </p>
          </div>
        </div>

        <label htmlFor="delete-reason" className="mt-5 block text-sm font-medium text-navy/75">
          Why are you leaving? <span className="font-normal text-navy/40">(optional)</span>
        </label>
        <textarea
          id="delete-reason"
          rows={3}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="It helps us improve."
          className={`${INPUT} resize-y`}
        />

        <label htmlFor="delete-confirm" className="mt-4 block text-sm font-medium text-navy/75">
          Type <strong>{WORD}</strong> to confirm
        </label>
        <input id="delete-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={INPUT} />

        {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy} className={BUTTON}>
            Keep my account
          </Button>
          <Button type="submit" disabled={!ready || busy} className={`${BUTTON} !bg-none !bg-red-600 hover:!bg-red-700`}>
            {busy ? 'Sending…' : 'Request deletion'}
          </Button>
        </div>
      </form>
    </div>
  )
}
