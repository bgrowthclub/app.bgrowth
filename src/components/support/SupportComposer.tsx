import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'

interface Props {
  placeholder: string
  busy: boolean
  onSend: (text: string) => Promise<boolean> | boolean
}

// The reply box of a support conversation. Enter sends, Shift+Enter adds a
// line. Keeps the text if sending fails.
export default function SupportComposer({ placeholder, busy, onSend }: Props) {
  const [text, setText] = useState('')

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value || busy) return
    if (await onSend(value)) setText('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={2}
        maxLength={5000}
        className="min-h-[52px] flex-1 resize-none rounded-2xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy outline-none placeholder:text-navy/30 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      />
      <button
        type="submit"
        disabled={busy || !text.trim()}
        aria-label="Send"
        className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <SendHorizontal size={18} />
      </button>
    </form>
  )
}
