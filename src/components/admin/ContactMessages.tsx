import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { CARD } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminContactMessage } from '../../modules/admin/types'

// Messages from people with no account (08/11/2026). They are answered by
// e-mail — the reply button is the visitor's own address — and closed here
// so the list stays a list of what is left to do.
export default function ContactMessages() {
  const [messages, setMessages] = useState<AdminContactMessage[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = () =>
    adminService
      .listContactMessages()
      .then((r) => setMessages(r.messages ?? []))
      .catch(() => setMessages([]))

  useEffect(() => {
    void load()
  }, [])

  if (messages.length === 0) return null

  return (
    <section className={`${CARD} mb-6 p-5`}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
        <Mail size={17} className="text-primary" aria-hidden />
        Messages from visitors ({messages.length})
      </h2>
      <p className="mt-1 text-[13px] text-navy/55">Sent from the public contact page by people without an account. Reply by e-mail, then close.</p>

      <ul className="mt-4 space-y-2">
        {messages.map((m) => {
          const expanded = open === m.id
          return (
            <li key={m.id} className="rounded-xl border border-navy/[0.08] bg-bg-soft/50 px-4 py-3">
              <button type="button" onClick={() => setOpen(expanded ? null : m.id)} className="flex w-full items-baseline justify-between gap-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-navy">{m.subject}</span>
                  <span className="block truncate text-[12.5px] text-navy/55">
                    {m.name} · {m.email}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-navy/35">{new Date(m.created_at).toLocaleDateString()}</span>
              </button>

              {expanded && (
                <>
                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white px-4 py-3 text-[13.5px] leading-relaxed text-navy/75">{m.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                      className="rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90"
                    >
                      Reply by e-mail
                    </a>
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => {
                        setBusy(m.id)
                        adminService
                          .closeContactMessage(m.id)
                          .then(load)
                          .catch(() => undefined)
                          .finally(() => setBusy(null))
                      }}
                      className="rounded-xl border border-navy/10 bg-white px-3.5 py-2 text-[13px] font-semibold text-navy/70 hover:border-primary/40 hover:text-navy disabled:opacity-50"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
