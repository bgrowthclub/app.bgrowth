import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../ui/Button'

interface Props {
  busy: boolean
  error: string | null
  onSubmit: (subject: string, message: string) => void
  onCancel?: () => void
}

const INPUT =
  'w-full rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15'

// Starts a support conversation: a subject and the first message.
export default function NewSupportConversation({ busy, error, onSubmit, onCancel }: Props) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (subject.trim() && message.trim()) onSubmit(subject.trim(), message.trim())
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="font-display text-lg font-bold text-navy">How can we help?</h2>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject — e.g. “Can’t open my Workspace”"
        maxLength={200}
        className={INPUT}
        required
        aria-label="Subject"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell us what happened, and which Workspace it’s about."
        rows={6}
        maxLength={5000}
        className={`${INPUT} resize-y`}
        required
        aria-label="Message"
      />
      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy} className="!rounded-xl !px-5 !py-2.5 !text-[13px]">
          {busy ? 'Sending…' : 'Send message'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="!rounded-xl !px-4 !py-2.5 !text-[13px]">
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
