import { ArrowRight, BookOpen } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import Button from '../../components/ui/Button'
import SignupInterests from '../../components/newsletter/SignupInterests'
import { useNewsletterSignup } from '../../modules/newsletter/useNewsletterSignup'

// Knowledge and Resources while their content is still being prepared
// (data/contentStatus.ts KNOWLEDGE_LIVE): a short note and an e-mail
// sign-up instead of the example articles.
export default function KnowledgeComingSoonPage() {
  const signup = useNewsletterSignup('knowledge')
  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO title="Knowledge" description="Free guides, articles and videos from BGrowth — coming soon." path="/knowledge" />
      <section className="container-px mx-auto max-w-xl text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
          <BookOpen size={24} strokeWidth={2} />
        </div>
        <p className="eyebrow mt-6">Coming soon</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">Free guides, articles and videos</h1>
        <p className="mx-auto mt-4 text-[15px] leading-relaxed text-navy/55">
          We’re preparing practical content to help you start, organize and grow. Leave your e-mail and we’ll let you know when it’s ready.
        </p>
        <form onSubmit={signup.submit} className="mx-auto mt-8 flex max-w-md gap-2">
          <input
            type="email"
            required
            value={signup.email}
            onChange={(e) => signup.setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="E-mail address"
            className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
          />
          <Button type="submit" className="shrink-0" icon={<ArrowRight size={15} />}>
            {signup.state === 'sending' ? '…' : signup.done ? 'Done' : 'Notify me'}
          </Button>
        </form>
        {signup.message && (
          <p role="status" className={`mt-3 text-[13px] ${signup.state === 'error' ? 'text-red-500' : 'text-navy/55'}`}>
            {signup.message}
          </p>
        )}
        {signup.token && (
          <div className="mx-auto mt-2 max-w-md text-left">
            <SignupInterests token={signup.token} />
          </div>
        )}
        <div className="mt-10">
          <Button to="/systems" variant="secondary" icon={<ArrowRight size={15} />}>
            Explore the catalog
          </Button>
        </div>
      </section>
    </div>
  )
}
