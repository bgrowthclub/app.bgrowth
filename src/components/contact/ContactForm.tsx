import { FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'

export const CONTACT_CATEGORIES = ['General Questions', 'Support', 'Sales', 'Partnerships', 'Business Opportunities', 'Media']

const inputClass =
  'w-full rounded-2xl border border-navy/10 bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 focus:border-primary/30'

interface Props {
  category: string
  onCategoryChange: (category: string) => void
}

export default function ContactForm({ category, onCategoryChange }: Props) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: no Contact API exists yet. Once it does, submit the FormData
    // here (name, email, subject, category, message) and render the real
    // success/error result instead of doing nothing.
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
