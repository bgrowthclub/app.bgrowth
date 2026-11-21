import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { CONTACT_CATEGORIES } from '../contact/ContactForm'

interface Props {
  busy: boolean
  error: string | null
  onSubmit: (subject: string, message: string) => void
  onCancel?: () => void
  // Filled in when the member came from a product's "Need help with this?"
  // (01/11/2026) — only the starting value; they can change it.
  defaultSubject?: string
}

const INPUT =
  'w-full rounded-xl border border-navy/10 bg-white px-3.5 py-3 text-[14px] text-navy placeholder:text-navy/35 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
const LABEL = 'mb-1.5 block text-[13px] font-semibold text-navy/75'

// Starts a support conversation (new look 21/11/2026, the owner's design):
// Topic, Subject and Message. The topic is the Contact page's list and is
// kept at the start of the subject ("[Account & billing] Can't upgrade") —
// the owner's choice, so the team sees it with no database change. No file
// attachments yet (on the site plan).
export default function NewSupportConversation({ busy, error, onSubmit, onCancel, defaultSubject }: Props) {
  const [topic, setTopic] = useState(defaultSubject ? 'Help with a product' : '')
  const [subject, setSubject] = useState(defaultSubject ?? '')
  const [message, setMessage] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!topic || !subject.trim() || !message.trim()) return
    onSubmit(`[${topic}] ${subject.trim()}`, message.trim())
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-display text-[20px] font-bold text-navy">Start a new conversation</h2>
      <label className="block">
        <span className={LABEL}>Topic</span>
        <span className="relative block">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} required className={`${INPUT} appearance-none pr-10 ${topic ? '' : 'text-navy/40'}`}>
            <option value="" disabled>
              Select a topic
            </option>
            {CONTACT_CATEGORIES.map((c) => (
              <option key={c.label} value={c.label} className="text-navy">
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40" aria-hidden />
        </span>
      </label>
      <label className="block">
        <span className={LABEL}>Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Can’t open my Workspace"
          maxLength={180}
          className={INPUT}
          required
        />
      </label>
      <label className="block">
        <span className={LABEL}>Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what happened, and which Workspace it’s about."
          rows={5}
          maxLength={5000}
          className={`${INPUT} resize-y`}
          required
        />
      </label>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14.5px] font-semibold text-white shadow-softer transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {busy ? 'Sending…' : 'Send message'}
        <ArrowRight size={16} aria-hidden />
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="w-full text-center text-[13px] font-semibold text-navy/50 hover:text-navy">
          Cancel
        </button>
      )}
    </form>
  )
}
