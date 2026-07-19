import { FormEvent, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Button from '../ui/Button'

export const CONTACT_CATEGORIES = ['General Questions', 'Support', 'Sales', 'Partnerships', 'Business Opportunities', 'Media']

const inputClass =
  'w-full rounded-2xl border border-navy/10 bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 focus:border-primary/30'

interface Props {
  category: string
  onCategoryChange: (category: string) => void
}

// No backend — submitting only flips local state to a mock success view,
// the same pattern already used by the newsletter forms elsewhere in this
// app. Ready to swap for a real submit handler once one exists.
export default function ContactForm({ category, onCategoryChange }: Props) {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-xl3 border border-navy/[0.06] bg-white px-8 py-16 text-center shadow-softer">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
          <CheckCircle2 size={26} strokeWidth={2} aria-hidden="true" />
        </div>
        <h3 className="mt-5 font-display text-xl font-bold text-navy">Message sent.</h3>
        <p className="mt-2 max-w-sm text-[14.5px] leading-relaxed text-navy/55">
          Thanks for reaching out — our team typically replies within 1–2 business days.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
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

      <Button type="submit" className="mt-6 w-full sm:w-auto" icon={<ArrowRight size={15} />}>
        Send Message
      </Button>
    </form>
  )
}
