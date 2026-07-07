import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import MemberBanner from '../ui/MemberBanner'
import Button from '../ui/Button'

export default function BecomeMember() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <section id="become-a-member" className="section-py relative">
      <div className="container-px mx-auto max-w-page">
        <MemberBanner
          eyebrow="BGrowth Club"
          title="Become a Member"
          description="Get member pricing on every Business System, early access to new releases, and exclusive resources."
          footnote="2,500+ entrepreneurs already members"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
            <Button type="submit" className="shrink-0" icon={!submitted && <ArrowRight size={15} />}>
              {submitted ? 'You’re a member' : 'Join BGrowth Club'}
            </Button>
          </form>
        </MemberBanner>
      </div>
    </section>
  )
}
