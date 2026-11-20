import { FormEvent, useState } from 'react'
import { ArrowRight, Handshake, LifeBuoy, MessageCircle, Newspaper, Send, ShieldCheck, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getCaptchaToken } from '../../lib/captcha'

// The topics a visitor can pick (20/11/2026, the owner's choice). More come
// as products open (apps, Marketplace…) — add a row here, nothing else.
export const CONTACT_CATEGORIES: { label: string; icon: LucideIcon }[] = [
  { label: 'General question', icon: MessageCircle },
  { label: 'Account & billing', icon: UserRound },
  { label: 'Help with a product', icon: LifeBuoy },
  { label: 'Partnerships', icon: Handshake },
  { label: 'Press & media', icon: Newspaper },
]

const inputClass =
  'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14.5px] text-navy placeholder:text-navy/30 transition-colors focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10'

interface Props {
  defaultName?: string
  defaultEmail?: string
}

// The contact form (new look 20/11/2026, the owner's design): the topic as
// chips, name, e-mail, subject and message — all required. It sends through
// api/ingles.ts?action=contact with the topic in the subject line, as before.
export default function ContactForm({ defaultName = '', defaultEmail = '' }: Props) {
  const [category, setCategory] = useState(CONTACT_CATEGORIES[0].label)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const captchaToken = await getCaptchaToken('contact')
      const res = await fetch('/api/ingles?action=contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          // The topic is part of the subject so the team sees it in the e-mail's subject line.
          subject: `[${category}] ${String(data.get('subject') ?? '')}`,
          message: String(data.get('message') ?? ''),
          captchaToken,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'We couldn’t send your message. Please try again.')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn’t send your message. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-navy/[0.07] bg-white p-6 shadow-softer sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
          <Send size={20} aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-[21px] font-bold text-navy">Send us a message</h2>
          <p className="mt-0.5 text-[14px] text-navy/55">Fill out the form and we’ll be in touch.</p>
        </div>
      </div>

      {sent ? (
        <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
          <h3 className="font-display text-lg font-bold text-emerald-900">Your message is on its way.</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-emerald-900/80">
            A real person reads these, and we usually reply within one or two business days. If you don’t hear from us,
            check your spam folder before writing again — that is where we tend to end up.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <fieldset>
            <legend className="mb-2 text-[13.5px] font-semibold text-navy">Topic</legend>
            <div className="flex flex-wrap gap-2">
              {CONTACT_CATEGORIES.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={category === label}
                  onClick={() => setCategory(label)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13.5px] font-semibold transition-colors ${
                    category === label ? 'border-primary/40 bg-blue-50 text-primary' : 'border-navy/10 text-navy/70 hover:border-primary/25 hover:text-navy'
                  }`}
                >
                  <Icon size={16} aria-hidden /> {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="mb-1.5 block text-[13.5px] font-semibold text-navy">
                Full name
              </label>
              <input id="contact-name" name="name" type="text" required defaultValue={defaultName} placeholder="e.g. Jane Cooper" className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1.5 block text-[13.5px] font-semibold text-navy">
                Email address
              </label>
              <input id="contact-email" name="email" type="email" required defaultValue={defaultEmail} placeholder="e.g. jane@company.com" className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="mb-1.5 block text-[13.5px] font-semibold text-navy">
              Subject
            </label>
            <input id="contact-subject" name="subject" type="text" required placeholder="What can we help you with?" className={inputClass} />
          </div>

          <div>
            <label htmlFor="contact-message" className="mb-1.5 block text-[13.5px] font-semibold text-navy">
              Message
            </label>
            <textarea id="contact-message" name="message" required rows={5} placeholder="Tell us a little more so we can help…" className={`${inputClass} resize-y`} />
            <p className="mt-1.5 text-[12.5px] text-navy/45">Share any details that will help our team assist you better.</p>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-grad-primary px-5 py-3.5 text-[15px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send message'} {!busy && <ArrowRight size={17} aria-hidden />}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[12.5px] text-navy/45">
            <ShieldCheck size={14} aria-hidden /> We only use your details to reply to you.
          </p>
        </form>
      )}
    </div>
  )
}
