import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { newsletterService } from '../../modules/newsletter/newsletterService'
import SEO from '../../components/seo/SEO'
import NewsletterPreferencesCard from '../../components/newsletter/NewsletterPreferencesCard'

// Where the confirmation e-mail's button lands: confirms the subscription,
// then offers the interests. ?invite= is the "Yes, keep me posted" button of
// the one-time invite to the old Wix site's contacts (Sprint 116): it
// subscribes them first, then shows the same card.
export default function NewsletterConfirmPage() {
  const [params] = useSearchParams()
  const invite = params.get('invite') ?? ''
  const [inviteToken, setInviteToken] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const token = invite ? inviteToken : params.get('token') ?? ''

  useEffect(() => {
    if (!invite) return
    newsletterService
      .acceptInvite(invite)
      .then(setInviteToken)
      .catch((err) => setInviteError(err instanceof Error ? err.message : 'This invitation link isn’t valid.'))
  }, [invite])

  return (
    <div className="pb-28 pt-32 md:pt-40">
      <SEO title="Confirm Subscription" description="Confirm your BGrowth newsletter subscription." path="/newsletter/confirm" />
      <div className="container-px mx-auto max-w-narrow">
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">You’re in.</h1>
        <p className="mt-3 text-[15px] text-navy/55">News and new Workspaces from BGrowth, in the areas you choose.</p>
        <div className="mt-10">
          {inviteError ? (
            <p className="text-[15px] text-red-500">{inviteError}</p>
          ) : invite && !inviteToken ? (
            <p className="text-[15px] text-navy/45">One moment…</p>
          ) : (
            <NewsletterPreferencesCard token={token} confirm />
          )}
        </div>
      </div>
    </div>
  )
}
