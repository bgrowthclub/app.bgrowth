import { useEffect, useRef } from 'react'
import type { SupportMessage } from '../../modules/support/types'

interface Props {
  messages: SupportMessage[]
  // Whose messages sit on the right ("mine"): the member's own page shows
  // their messages on the right; the team's inbox shows the team's.
  mine: 'customer' | 'staff'
}

function stamp(iso: string) {
  const d = new Date(iso)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// The messages of one support conversation, as chat bubbles, kept scrolled
// to the newest one.
export default function SupportMessageList({ messages, mine }: Props) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const own = m.sender === mine
        return (
          <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                  own ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-bg-soft text-navy'
                }`}
              >
                {m.body}
              </div>
              <p className="mt-1 px-1 text-[11px] text-navy/40">
                {m.sender === 'staff' ? m.author_name || 'BGrowth Support' : m.author_name || 'Member'} · {stamp(m.created_at)}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={end} />
    </div>
  )
}
