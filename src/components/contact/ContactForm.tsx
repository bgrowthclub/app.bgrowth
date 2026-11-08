import { FormEvent, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import { getCaptchaToken } from '../../lib/captcha'

export const CONTACT_CATEGORIES = ['General Questions', 'Support', 'Sales', 'Partnerships', 'Business Opportunities', 'Media']

const inputClass =
  'w-full rounded-2xl border border-navy/10 bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 focus:border-primary/30'

interface Props {
  category: string
  onCategoryChange: (category: string) => void
}

export default function ContactForm({ category, onCategoryChange }: Props) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Until 08/11/2026 this did NOTHING: pressing Send ran preventDefault and
  // stopped there. The page looked complete, the visitor got no error and no
  // thank-you, and the message reached nobody — worse than having no form,
  // because it looks like someone is listening.
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
          // The category is part of the subject so the team sees what it is
          // about in the e-mail's own subject line, without opening anything.
          subject: `[${String(data.get('category') ?? 'General')}] ${String(data.get('subject') ?? '')}`,
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

  if (sent) {
    return (
      <div className="rounded-xl3 border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
        <h3 className="font-display text-lg font-bold text-emerald-900">Your message is on its way.</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-emerald-900/80">
          A real person reads these, and we usually reply within one or two business days. If you don’t hear from us,
          check your spam folder before writing again — that is where we tend to end up.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-[13px] font-semibold text-navy">
            Full Name
          </label>
          <input id="contact-name" name="name" type="text" required placeholder="Jane Cooper" className={inputClass} />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-[13px] font-semibold text-navy">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required placeholder="you@business.com" className={inputClass} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="contact-subject" className="mb-1.5 block text-[13px] font-semibold text-navy">
            Subject
          </label>
          <input id="contact-subject" name="subject" type="text" required placeholder="How can we help?" className={inputClass} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="contact-category" className="mb-1.5 block text-[13px] font-semibold text-navy">
            Category
          </label>
          <select
            id="contact-category"
            name="category"
            required
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`${inputClass} appearance-none`}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {CONTACT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="contact-message" className="mb-1.5 block text-[13px] font-semibold text-navy">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            placeholder="Tell us a bit about what you need…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {error && <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{error}</p>}

      <Button type="submit" disabled={busy} className="mt-6 w-full sm:w-auto" icon={busy ? undefined : <ArrowRight size={15} />}>
        {busy ? 'Sending…' : 'Send Message'}
      </Button>
    </form>
  )
}
