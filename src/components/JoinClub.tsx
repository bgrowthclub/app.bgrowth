import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Users } from 'lucide-react'

export default function JoinClub() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <section id="join" className="section-py relative">
      <div className="container-px mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="glass-card relative overflow-hidden px-8 py-14 text-center md:px-16 md:py-20"
        >
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(16,97,236,0.16), rgba(255,255,255,0) 70%)' }}
          />
          <div className="badge mx-auto">
            <Users size={14} strokeWidth={2.5} />
            Founding Members
          </div>
          <h2 className="mx-auto mt-5 max-w-xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Become a Founding Member
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-navy/55">
            Get early access to new Business Systems, exclusive templates, member discounts, weekly releases, and premium resources.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
            <button type="submit" className="btn-primary shrink-0">
              {submitted ? 'You’re on the list' : 'Join Waitlist'}
              {!submitted && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="mt-5 text-[12.5px] text-navy/35">2,500+ entrepreneurs waiting</p>
        </motion.div>
      </div>
    </section>
  )
}
