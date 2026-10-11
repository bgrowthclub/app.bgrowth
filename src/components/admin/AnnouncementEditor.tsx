import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../ui/Button'
import AnnouncementBar from '../layout/AnnouncementBar'
import { CARD, INPUT, SMALL_BUTTON } from './styles'
import type { AdminAnnouncementDraft } from '../../modules/admin/types'
import type { AnnouncementTone, SiteAnnouncement } from '../../modules/site/types'

const TONES: { id: AnnouncementTone; label: string }[] = [
  { id: 'news', label: 'Blue — news' },
  { id: 'promo', label: 'Green — promotion' },
  { id: 'notice', label: 'Yellow — notice' },
]

// ISO ↔ <input type="datetime-local"> (local time).
function toInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromInput = (value: string) => (value ? new Date(value).toISOString() : null)

function draftFrom(a: SiteAnnouncement | null): AdminAnnouncementDraft {
  return {
    id: a?.id,
    title: a?.title ?? '',
    body: a?.body ?? '',
    linkUrl: a?.link_url ?? '',
    linkLabel: a?.link_label ?? '',
    tone: a?.tone ?? 'news',
    showBanner: a?.show_banner ?? true,
    showBell: a?.show_bell ?? true,
    active: a?.active ?? true,
    startsAt: a?.starts_at ?? null,
    endsAt: a?.ends_at ?? null,
  }
}

interface Props {
  announcement: SiteAnnouncement | null
  onSave: (draft: AdminAnnouncementDraft) => Promise<void>
  onCancel: () => void
}

// Create or edit one announcement (Admin → Site): where it shows (top bar,
// bell or both), its color, link and optional dates, with a live preview of
// the bar.
export default function AnnouncementEditor({ announcement, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<AdminAnnouncementDraft>(() => draftFrom(announcement))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof AdminAnnouncementDraft>(key: K, value: AdminAnnouncementDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the announcement.')
    } finally {
      setSaving(false)
    }
  }

  const preview: SiteAnnouncement = {
    id: 'preview',
    title: draft.title || 'Your announcement title',
    body: draft.body,
    link_url: draft.linkUrl || null,
    link_label: draft.linkLabel || null,
    tone: draft.tone,
    show_banner: draft.showBanner,
    show_bell: draft.showBell,
    active: draft.active,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt,
    created_at: '',
    updated_at: '',
  }

  const label = 'mb-1.5 block text-[13px] font-semibold text-navy'
  return (
    <form onSubmit={(e) => void submit(e)} className={`${CARD} space-y-5 p-6`}>
      <h2 className="font-display text-lg font-bold text-navy">{announcement ? 'Edit announcement' : 'New announcement'}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="ann-title" className={label}>
            Title
          </label>
          <input id="ann-title" required maxLength={140} value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="New this week: Jurat Certificate Kit" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ann-body" className={label}>
            Text <span className="font-normal text-navy/40">(optional — short)</span>
          </label>
          <textarea id="ann-body" rows={2} maxLength={500} value={draft.body} onChange={(e) => set('body', e.target.value)} className={INPUT} />
        </div>
        <div>
          <label htmlFor="ann-link" className={label}>
            Link <span className="font-normal text-navy/40">(optional)</span>
          </label>
          <input id="ann-link" value={draft.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="/product/… or https://…" className={INPUT} />
        </div>
        <div>
          <label htmlFor="ann-link-label" className={label}>
            Link text
          </label>
          <input id="ann-link-label" maxLength={40} value={draft.linkLabel} onChange={(e) => set('linkLabel', e.target.value)} placeholder="Learn more" className={INPUT} />
        </div>
        <div>
          <label htmlFor="ann-tone" className={label}>
            Color
          </label>
          <select id="ann-tone" value={draft.tone} onChange={(e) => set('tone', e.target.value as AnnouncementTone)} className={INPUT}>
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className={label}>Show it in</legend>
          <div className="flex flex-wrap gap-4 pt-2 text-[13.5px] text-navy">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.showBanner} onChange={(e) => set('showBanner', e.target.checked)} className="h-4 w-4 accent-primary" />
              Top bar (public site)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.showBell} onChange={(e) => set('showBell', e.target.checked)} className="h-4 w-4 accent-primary" />
              Bell (member area)
            </label>
          </div>
        </fieldset>
        <div>
          <label htmlFor="ann-start" className={label}>
            Starts <span className="font-normal text-navy/40">(empty = now)</span>
          </label>
          <input id="ann-start" type="datetime-local" value={toInput(draft.startsAt)} onChange={(e) => set('startsAt', fromInput(e.target.value))} className={INPUT} />
        </div>
        <div>
          <label htmlFor="ann-end" className={label}>
            Ends <span className="font-normal text-navy/40">(empty = until you turn it off)</span>
          </label>
          <input id="ann-end" type="datetime-local" value={toInput(draft.endsAt)} onChange={(e) => set('endsAt', fromInput(e.target.value))} className={INPUT} />
        </div>
        <label className="flex items-center gap-2 text-[13.5px] font-semibold text-navy sm:col-span-2">
          <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-primary" />
          On
        </label>
      </div>

      {draft.showBanner && (
        <div>
          <p className={label}>Top bar preview</p>
          <div className="overflow-hidden rounded-xl border border-navy/[0.06]">
            <AnnouncementBar announcement={preview} onClose={() => undefined} />
          </div>
        </div>
      )}

      {error && <p className="text-[13.5px] text-red-500">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving} className={SMALL_BUTTON}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className={SMALL_BUTTON}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
