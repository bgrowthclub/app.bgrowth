import { useSearchParams } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import NewsletterPreferencesCard from '../../components/newsletter/NewsletterPreferencesCard'

// "Choose your interests" / "Unsubscribe" from the footer of every
// newsletter e-mail — no sign-in needed, the link's token identifies them.
export default function NewsletterPreferencesPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  return (
    <div className="pb-28 pt-32 md:pt-40">
      <SEO title="E-mail Preferences" description="Choose which BGrowth e-mails you get." path="/newsletter/preferences" />
      <div className="container-px mx-auto max-w-narrow">
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">E-mail preferences</h1>
        <div className="mt-10">
          {token ? (
            <NewsletterPreferencesCard token={token} unsubscribe={params.get('action') === 'unsubscribe'} />
          ) : (
            <p className="rounded-xl bg-bg-soft p-5 text-[14px] text-navy/70">
              Open this page from the link at the bottom of any BGrowth e-mail. Members can also change this in Settings.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
