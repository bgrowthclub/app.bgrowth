import { useEffect, useState } from 'react'
import { Briefcase, Check, Globe, GraduationCap, HeartPulse, Mail, Rocket, UserRound, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { newsletterService } from '../../modules/newsletter/newsletterService'
import { GROWTH_CATEGORIES, type GrowthCategoryId } from '../../types/growth'

const AREA_ICONS: Record<GrowthCategoryId, LucideIcon> = {
  'business-entrepreneurship': Briefcase,
  'careers-professions': UserRound,
  languages: Globe,
  'personal-finance': Wallet,
  productivity: Rocket,
  education: GraduationCap,
  'health-wellness': HeartPulse,
  'family-lifestyle': Users,
}

const ALL = GROWTH_CATEGORIES.map((a) => a.id)

// Settings → Notifications (new look 20/11/2026, the owner's design): the
// member's newsletter subscription. The eight areas are the site's own (the
// newsletter is sent by them — more come only when they exist), shown as
// boxes to tick; "Stop all marketing e-mails" is the unsubscribe. Saved as
// before: no areas stored = every area, so all ticked is saved as none.
export default function EmailUpdatesSettings() {
  const [loaded, setLoaded] = useState(false)
  const [stopAll, setStopAll] = useState(false)
  const [picked, setPicked] = useState<GrowthCategoryId[]>(ALL)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    newsletterService
      .getMine()
      .then((p) => {
        setStopAll(p.status !== 'subscribed')
        setPicked(p.interests.length ? p.interests : ALL)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load your e-mail settings.'))
      .finally(() => setLoaded(true))
  }, [])

  const toggle = (id: GrowthCategoryId) => {
    setNotice(null)
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  }

  async function save() {
    setSaving(true)
    setNotice(null)
    setError(null)
    try {
      const interests = picked.length === ALL.length ? [] : picked
      const p = await newsletterService.saveMine(!stopAll, interests)
      setStopAll(p.status !== 'subscribed')
      setPicked(p.interests.length ? p.interests : ALL)
      setNotice(stopAll ? 'Saved — you won’t get BGrowth news e-mails anymore.' : 'Saved — you’ll get news in the areas you picked.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const nothing = !stopAll && picked.length === 0

  return (
    <section>
      <h2 className="font-display text-[22px] font-bold text-navy">Email preferences</h2>
      <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-navy/55">
        News and new Workspaces from BGrowth. Pick the areas you care about — we’ll only write about those. Account e-mails
        (receipts, trial reminders, support) always arrive.
      </p>
      {!loaded ? (
        <p className="mt-6 text-[14px] text-navy/40">Loading…</p>
      ) : (
        <>
          <div className="mt-6 flex items-baseline justify-between gap-3">
            <p className="text-[14px] font-semibold text-navy">Choose your interests</p>
            <p className="text-[13px] text-navy/45">{stopAll ? 'Paused' : `${picked.length} selected`}</p>
          </div>
          <div className={`mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3 ${stopAll ? 'opacity-50' : ''}`}>
            {GROWTH_CATEGORIES.map((area) => {
              const on = picked.includes(area.id)
              const Icon = AREA_ICONS[area.id]
              return (
                <button
                  key={area.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  disabled={saving || stopAll}
                  onClick={() => toggle(area.id)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] font-medium transition-colors disabled:cursor-default ${
                    on ? 'border-primary/30 bg-blue-50/70 text-navy' : 'border-navy/10 bg-white text-navy/70 hover:border-primary/25'
                  }`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${on ? 'border-primary bg-primary text-white' : 'border-navy/20'}`}>
                    {on && <Check size={13} strokeWidth={3} aria-hidden />}
                  </span>
                  <Icon size={18} className="shrink-0 text-navy/55" aria-hidden />
                  <span>{area.label}</span>
                </button>
              )
            })}
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-4 rounded-2xl border border-navy/[0.08] bg-white px-5 py-4">
            <Mail size={24} className="shrink-0 text-navy/60" aria-hidden />
            <span className="flex-1">
              <span className="block text-[14.5px] font-semibold text-navy">Stop all marketing e-mails</span>
              <span className="block text-[13px] text-navy/55">Unsubscribe from all newsletters and promotional e-mails.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={stopAll}
              disabled={saving}
              onChange={(e) => {
                setNotice(null)
                setStopAll(e.target.checked)
              }}
              className="sr-only"
            />
            <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${stopAll ? 'bg-primary' : 'bg-navy/15'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${stopAll ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
          </label>

          {nothing && <p className="mt-3 text-[13px] text-amber-700">Pick at least one area, or turn on “Stop all marketing e-mails”.</p>}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={saving || nothing}
              onClick={() => void save()}
              className="rounded-xl bg-primary px-6 py-3 text-[14.5px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </>
      )}
      {notice && <p role="status" className="mt-3 text-right text-[14px] font-medium text-primary">{notice}</p>}
      {error && <p className="mt-3 text-[14px] text-red-500">{error}</p>}
    </section>
  )
}
