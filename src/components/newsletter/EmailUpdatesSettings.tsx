import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import InterestPicker from './InterestPicker'
import { newsletterService } from '../../modules/newsletter/newsletterService'
import type { GrowthCategoryId } from '../../types/growth'

// Settings → E-mail updates: the signed-in member's own newsletter
// subscription and the areas they want to hear about.
export default function EmailUpdatesSettings() {
  const [loaded, setLoaded] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [interests, setInterests] = useState<GrowthCategoryId[]>([])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    newsletterService
      .getMine()
      .then((p) => {
        setSubscribed(p.status === 'subscribed')
        setInterests(p.interests)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load your e-mail settings.'))
      .finally(() => setLoaded(true))
  }, [])

  async function save(nextSubscribed: boolean) {
    setSaving(true)
    setNotice(null)
    setError(null)
    try {
      const p = await newsletterService.saveMine(nextSubscribed, interests)
      setSubscribed(p.status === 'subscribed')
      setInterests(p.interests)
      setNotice(nextSubscribed ? 'Saved — you’ll get news in the areas you picked.' : 'You won’t get BGrowth news e-mails anymore.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer md:p-8">
      <h2 className="font-display text-xl font-bold text-navy">E-mail updates</h2>
      <p className="mt-1 max-w-xl text-[14px] text-navy/55">
        News and new Workspaces from BGrowth. Pick the areas you care about — we’ll only write about those.
        Account e-mails (receipts, trial reminders, support) always arrive.
      </p>
      {!loaded ? (
        <p className="mt-6 text-[14px] text-navy/40">Loading…</p>
      ) : (
        <>
          <div className="mt-6">
            <InterestPicker value={interests} onChange={setInterests} disabled={saving} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" disabled={saving} onClick={() => void save(true)}>
              {saving ? 'Saving…' : subscribed ? 'Save interests' : 'Subscribe'}
            </Button>
            {subscribed && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void save(false)}
                className="text-[13px] font-medium text-navy/50 hover:text-navy"
              >
                Stop news e-mails
              </button>
            )}
          </div>
          <p className="mt-3 text-[13px] text-navy/45">{subscribed ? 'You’re subscribed.' : 'You’re not subscribed.'}</p>
        </>
      )}
      {notice && <p role="status" className="mt-3 text-[14px] font-medium text-primary">{notice}</p>}
      {error && <p className="mt-3 text-[14px] text-red-500">{error}</p>}
    </section>
  )
}
