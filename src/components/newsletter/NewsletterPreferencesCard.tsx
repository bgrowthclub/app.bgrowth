import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import InterestPicker from './InterestPicker'
import { newsletterService } from '../../modules/newsletter/newsletterService'
import type { NewsletterPreferences } from '../../modules/newsletter/types'
import type { GrowthCategoryId } from '../../types/growth'

interface Props {
  token: string
  // From the confirmation e-mail: confirm first, then show the interests.
  confirm?: boolean
  // From an e-mail's "Unsubscribe" link: lead with that choice.
  unsubscribe?: boolean
}

// What a subscriber reaches from any newsletter e-mail — no sign-in, the
// link's token identifies them: confirm, pick interests, unsubscribe.
export default function NewsletterPreferencesCard({ token, confirm, unsubscribe }: Props) {
  const [prefs, setPrefs] = useState<NewsletterPreferences | null>(null)
  const [interests, setInterests] = useState<GrowthCategoryId[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = confirm ? newsletterService.confirm(token) : newsletterService.getPreferences(token)
    load
      .then((p) => {
        if (cancelled) return
        setPrefs(p)
        setInterests(p.interests)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'This link isn’t valid anymore.'))
    return () => {
      cancelled = true
    }
  }, [token, confirm])

  async function save(patch: { interests?: GrowthCategoryId[]; status?: 'subscribed' | 'unsubscribed' }, done: string) {
    setSaving(true)
    setNotice(null)
    setError(null)
    try {
      const next = await newsletterService.savePreferences(token, patch)
      setPrefs(next)
      setInterests(next.interests)
      setNotice(done)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (error && !prefs) {
    return <p className="rounded-xl bg-bg-soft p-5 text-[14px] text-navy/70">{error}</p>
  }
  if (!prefs) return <p className="py-10 text-center text-[14px] text-navy/40">Loading…</p>

  const subscribed = prefs.status === 'subscribed'

  return (
    <div className="space-y-8">
      {confirm && subscribed && (
        <p className="rounded-xl bg-bg-soft p-5 text-[14px] text-navy/70">
          You’re subscribed with <strong className="break-all">{prefs.email}</strong>. Pick the areas you care about below.
        </p>
      )}

      {unsubscribe && subscribed && (
        <div className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
          <p className="font-display text-lg font-bold text-navy">Unsubscribe from BGrowth e-mails?</p>
          <p className="mt-1 text-[14px] text-navy/55">
            Or keep only the areas you care about — pick them below instead.
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => void save({ status: 'unsubscribed' }, 'You’re unsubscribed. You won’t get BGrowth e-mails anymore.')}
            className="mt-4"
          >
            Unsubscribe
          </Button>
        </div>
      )}

      {!subscribed ? (
        <div className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
          <p className="font-display text-lg font-bold text-navy">
            {prefs.status === 'unsubscribed' ? 'You’re unsubscribed.' : 'Your subscription isn’t confirmed yet.'}
          </p>
          <p className="mt-1 text-[14px] text-navy/55 break-all">{prefs.email}</p>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void save({ status: 'subscribed', interests }, 'Welcome back — you’re subscribed again.')}
            className="mt-4"
          >
            Subscribe again
          </Button>
        </div>
      ) : (
        <div className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
          <p className="font-display text-lg font-bold text-navy">Your interests</p>
          <p className="mt-1 text-[14px] text-navy/55">
            We’ll tell you about new Workspaces and news in these areas. “All topics” means everything.
          </p>
          <div className="mt-5">
            <InterestPicker value={interests} onChange={setInterests} disabled={saving} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" disabled={saving} onClick={() => void save({ interests }, 'Saved.')}>
              {saving ? 'Saving…' : 'Save interests'}
            </Button>
            {!unsubscribe && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void save({ status: 'unsubscribed' }, 'You’re unsubscribed. You won’t get BGrowth e-mails anymore.')}
                className="text-[13px] font-medium text-navy/50 hover:text-navy"
              >
                Unsubscribe from all e-mails
              </button>
            )}
          </div>
        </div>
      )}

      {notice && <p role="status" className="text-[14px] font-medium text-primary">{notice}</p>}
      {error && <p className="text-[14px] text-red-500">{error}</p>}
    </div>
  )
}
