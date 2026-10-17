import { useEffect, useState } from 'react'
import { Megaphone, Plus } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AnnouncementEditor from '../../../components/admin/AnnouncementEditor'
import HomeHighlightsEditor from '../../../components/admin/HomeHighlightsEditor'
import LegalPagesEditor from '../../../components/admin/LegalPagesEditor'
import { CARD, LINK_BUTTON, SMALL_BUTTON, formatDate, pillClass } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminAnnouncementDraft, AdminSiteOverview } from '../../../modules/admin/types'
import type { SiteAnnouncement } from '../../../modules/site/types'

// Live now: on, inside its dates.
function state(a: SiteAnnouncement): { label: string; tone: 'green' | 'amber' | 'gray' } {
  const now = new Date().toISOString()
  if (!a.active) return { label: 'Hidden (not active)', tone: 'gray' }
  if (a.starts_at && a.starts_at > now) return { label: `Starts ${formatDate(a.starts_at)}`, tone: 'amber' }
  if (a.ends_at && a.ends_at <= now) return { label: 'Ended', tone: 'gray' }
  return { label: 'Live', tone: 'green' }
}

// Admin → Site (Portal migration 0046): announcements — the bar at the top
// of the public site and/or the bell in the member area — and the Home
// highlights — and, on the Legal pages tab (Portal migration 0053), the
// Privacy, Terms and Refund texts. Next here: SEO, menu/footer, page texts.
type SiteTab = 'general' | 'legal'
const SITE_TABS: { id: SiteTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'legal', label: 'Legal pages' },
]

export default function AdminSitePage() {
  const [tab, setTab] = useState<SiteTab>('general')
  const [data, setData] = useState<AdminSiteOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<SiteAnnouncement | 'new' | null>(null)
  const [removing, setRemoving] = useState<SiteAnnouncement | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .getSite()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the site settings.'))
  }, [])

  async function save(draft: AdminAnnouncementDraft) {
    const saved = await adminService.saveAnnouncement(draft)
    setData((d) =>
      d ? { ...d, announcements: draft.id ? d.announcements.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...d.announcements] } : d,
    )
    setEditing(null)
    setNotice(`“${saved.title}” saved.`)
  }

  async function confirmRemove() {
    if (!removing) return
    setBusy(true)
    try {
      await adminService.removeAnnouncement(removing.id)
      setData((d) => (d ? { ...d, announcements: d.announcements.filter((a) => a.id !== removing.id) } : d))
      setNotice(`“${removing.title}” deleted.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t delete the announcement.')
    } finally {
      setBusy(false)
      setRemoving(null)
    }
  }

  async function toggleOpen() {
    if (!data) return
    const next = !data.open
    const question = next
      ? 'Open the site to everyone? Visitors will see the whole site, not “Coming soon”.'
      : 'Close the site? Visitors will see “Coming soon”; only the team sees the site.'
    if (!window.confirm(question)) return
    setBusy(true)
    setError(null)
    try {
      const open = await adminService.setSiteOpen(next)
      setData((d) => (d ? { ...d, open } : d))
      setNotice(open ? 'The site is open to everyone.' : 'The site is closed — visitors see “Coming soon”.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t change it.')
    } finally {
      setBusy(false)
    }
  }

  async function saveHighlights(ids: string[]) {
    const featured = await adminService.saveHomeFeatured(ids)
    setData((d) => (d ? { ...d, featured } : d))
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Site · Admin" description="Announcements and Home highlights." path="/platform/admin/site" />
      <SectionHeader
        eyebrow="Admin"
        title="Site"
        description="Announcements, Home highlights, and the texts of the site’s pages."
        className="mb-6"
      />

      <div className="mb-8 flex gap-1 border-b border-navy/[0.08]">
        {SITE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-navy/50 hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'legal' ? (
        <LegalPagesEditor />
      ) : !data ? (
        error ? (
          <EmptyState icon={Megaphone} title="We couldn’t load the site settings." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : !data.ready ? (
        <EmptyState icon={Megaphone} title="Not ready yet." description="Run the database update (Portal migration 0046) to use this page." />
      ) : (
        <div className="space-y-8">
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
          {error && <p className="text-[14px] text-red-500">{error}</p>}

          <section className={`${CARD} flex flex-wrap items-center justify-between gap-4 px-5 py-4`}>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold text-navy">
                Site open to the public{' '}
                <span className={pillClass(data.open ? 'green' : 'amber')}>{data.open ? 'Open' : 'Coming soon'}</span>
              </p>
              <p className="mt-1 text-[13px] text-navy/50">
                {data.open
                  ? 'Everyone can see and use the site.'
                  : 'Visitors see “Coming soon” with a field to leave their e-mail. Only the team sees the site. Bruno’s course stays open.'}
              </p>
            </div>
            <Button type="button" variant={data.open ? 'secondary' : 'primary'} disabled={busy} onClick={() => void toggleOpen()} className={SMALL_BUTTON}>
              {data.open ? 'Close the site' : 'Open the site'}
            </Button>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-navy">Announcements</h2>
                <p className="mt-0.5 text-[13.5px] text-navy/55">The newest live one shows on the top bar; the bell lists the latest ten.</p>
              </div>
              {!editing && (
                <Button
                  type="button"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setNotice(null)
                    setEditing('new')
                  }}
                  className={SMALL_BUTTON}
                >
                  New announcement
                </Button>
              )}
            </div>

            {editing && (
              <AnnouncementEditor
                key={editing === 'new' ? 'new' : editing.id}
                announcement={editing === 'new' ? null : editing}
                onSave={save}
                onCancel={() => setEditing(null)}
              />
            )}

            {data.announcements.length === 0 ? (
              !editing && <EmptyState icon={Megaphone} title="No announcements yet." description="Write the first one — for example, this week’s new product." />
            ) : (
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {data.announcements.map((a) => {
                  const s = state(a)
                  return (
                    <div key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-navy">{a.title}</p>
                        <p className="mt-0.5 text-[12.5px] text-navy/45">
                          {[a.show_banner && 'Top bar', a.show_bell && 'Bell'].filter(Boolean).join(' + ')}
                          {a.ends_at ? ` · until ${formatDate(a.ends_at)}` : ''}
                        </p>
                      </div>
                      <span className={pillClass(s.tone)}>{s.label}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNotice(null)
                            setEditing(a)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => setRemoving(a)} className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <HomeHighlightsEditor key={data.featured.join()} products={data.products} initial={data.featured} onSave={saveHighlights} />
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Delete this announcement?"
        description={removing ? `“${removing.title}” disappears from the top bar and the bell.` : undefined}
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
