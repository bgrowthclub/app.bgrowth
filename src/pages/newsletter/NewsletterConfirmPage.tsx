import { useSearchParams } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import NewsletterPreferencesCard from '../../components/newsletter/NewsletterPreferencesCard'

// Where the confirmation e-mail's button lands: confirms the subscription,
// then offers the interests.
export default function NewsletterConfirmPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  return (
    <div className="pb-28 pt-32 md:pt-40">
      <SEO title="Confirm Subscription" description="Confirm your BGrowth newsletter subscription." path="/newsletter/confirm" />
      <div className="container-px mx-auto max-w-narrow">
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">You’re in.</h1>
        <p className="mt-3 text-[15px] text-navy/55">News and new Workspaces from BGrowth, in the areas you choose.</p>
        <div className="mt-10">
          <NewsletterPreferencesCard token={token} confirm />
        </div>
      </div>
    </div>
  )
}
