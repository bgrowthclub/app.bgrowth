import { CheckCircle2, MessageCircle } from 'lucide-react'
import { CONTACT_CATEGORIES } from '../contact/ContactForm'
import type { SupportConversationSummary } from '../../modules/support/types'

/** "[Account & billing] Can't upgrade" → its topic and the subject itself. */
export function splitSupportSubject(subject: string): { topic: string | null; title: string } {
  const m = /^\[([^\]]{1,40})\]\s*(.*)$/.exec(subject)
  return m ? { topic: m[1], title: m[2] || subject } : { topic: null, title: subject }
}

function when(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// The status as it really is: Closed, the team answered last (Replied), or
// waiting for our answer (Open).
function statusOf(c: SupportConversationSummary) {
  if (c.status === 'closed') return { label: 'Closed', pill: 'bg-emerald-50 text-emerald-700', tone: 'bg-emerald-50 text-emerald-600' }
  if (c.last_sender === 'staff') return { label: 'Replied', pill: 'bg-amber-50 text-amber-700', tone: 'bg-amber-50 text-amber-600' }
  return { label: 'Open', pill: 'bg-blue-50 text-primary', tone: 'bg-blue-50 text-primary' }
}

interface Props {
  items: SupportConversationSummary[]
  activeId: string | null
  onSelect: (id: string) => void
}

// The member's conversations on Support (21/11/2026, the owner's design): the
// topic's icon, the subject, its topic and what happens next, the real
// status and when. A sibling of SupportConversationList, which Admin uses.
export default function SupportRecentList({ items, activeId, onSelect }: Props) {
  return (
    <ul className="divide-y divide-navy/[0.06]">
      {items.map((c) => {
        const { topic, title } = splitSupportSubject(c.subject)
        const s = statusOf(c)
        const Icon = c.status === 'closed' ? CheckCircle2 : CONTACT_CATEGORIES.find((t) => t.label === topic)?.icon ?? MessageCircle
        const note = c.status === 'closed' ? 'Writing again reopens it' : c.last_sender === 'staff' ? 'BGrowth replied' : 'Waiting for our reply'
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              aria-current={c.id === activeId ? 'true' : undefined}
              className={`flex w-full items-start gap-3.5 rounded-xl px-2 py-4 text-left transition-colors hover:bg-bg-soft ${c.id === activeId ? 'bg-bg-soft' : ''}`}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${s.tone}`}>
                <Icon size={19} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[14.5px] font-semibold text-navy">{title}</span>
                  {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="New reply" />}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-navy/50">
                  {topic ? `${topic} · ` : ''}
                  {note}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${s.pill}`}>{s.label}</span>
                <span className="text-[11.5px] text-navy/40">{when(c.last_message_at)}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
