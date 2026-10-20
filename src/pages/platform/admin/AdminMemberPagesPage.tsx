import { useEffect, useState } from 'react'
import { Plus, SquareUser } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AdminMemberPageRow from '../../../components/admin/AdminMemberPageRow'
import MemberPageBuilder from '../../../components/find/MemberPageBuilder'
import { INPUT } from '../../../components/admin/styles'
import AdminMemberPageStats from '../../../components/admin/AdminMemberPageStats'
import { CARD, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminMemberPageDraft, AdminMemberPagesOverview } from '../../../modules/admin/types'
import type { MemberPage } from '../../../modules/find/types'
import MemberPageSignupsList from '../../../components/find/MemberPageSignupsList'

// Admin → Pages: members' public pages at bgrowth.app/p/<address> (Portal
// migration 0044). Subscribers will build their own once Plans &
// Subscriptions exist; until then the team builds them here.
export default function AdminMemberPagesPage() {
  const [data, setData] = useState<AdminMemberPagesOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<MemberPage | 'new' | null>(null)
  const [removing, setRemoving] = useState<MemberPage | null>(null)
  const [numbers, setNumbers] = useState<MemberPage | null>(null)
  const [contacts, setContacts] = useState<MemberPage | null>(null)
  // The e-mail list switched on by the team for this page (Sprint 139).
  const [signupGranted, setSignupGranted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  // The owner e-mail field of the page being edited (team only).
  const [ownerEmail, setOwnerEmail] = useState('')
  // The owner edits it themselves (Sprint 133).
  const [ownerManaged, setOwnerManaged] = useState(false)
  useEffect(() => {
    setOwnerEmail(editing && editing !== 'new' ? editing.owner_email ?? '' : '')
    setOwnerManaged(editing && editing !== 'new' ? Boolean(editing.owner_managed) : false)
    setSignupGranted(editing && editing !== 'new' ? Boolean(editing.signup_granted) : false)
  }, [editing])

  useEffect(() => {
    adminService
      .listMemberPages()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the pages.'))
  }, [])

  async function save(draft: AdminMemberPageDraft) {
    const { page: saved, warning } = await adminService.saveMemberPage(draft)
    setData((d) => (d ? { ...d, pages: draft.id ? d.pages.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...d.pages] } : d))
    setEditing(null)
    setNotice(
      warning ??
        (saved.owner_managed
          ? `${saved.display_name} now edits this page in My Business Page.`
          : saved.status === 'published'
            ? `bgrowth.app/p/${saved.slug} is live.`
            : `${saved.display_name}’s page saved as a draft.`),
    )
  }

  async function confirmRemove() {
    if (!removing) return
    setBusy(true)
    setError(null)
    try {
      await adminService.removeMemberPage(removing.id)
      setData((d) => (d ? { ...d, pages: d.pages.filter((p) => p.id !== removing.id) } : d))
      setNotice(`${removing.display_name}’s page was deleted.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t delete the page.')
    } finally {
      setBusy(false)
      setRemoving(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="Pages · Admin" description="Members’ public pages." path="/platform/admin/pages" />
      <SectionHeader
        eyebrow="Admin"
        title="Pages"
        description="Members’ own pages to promote their work, at bgrowth.app/p/<address>. Subscribers will build theirs once plans exist; for now the team builds them here."
        className="mb-8"
      />

      {!data ? (
        error ? (
          <EmptyState icon={SquareUser} title="We couldn’t load the pages." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : !data.ready ? (
        <EmptyState icon={SquareUser} title="Not ready yet." description="Run the database update (Portal migration 0044) to create pages." />
      ) : (
        <div className="space-y-6">
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
          {error && <p className="text-[14px] text-red-500">{error}</p>}

          {numbers && !editing && <AdminMemberPageStats key={numbers.id} page={numbers} onClose={() => setNumbers(null)} />}
          {contacts && !editing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-navy/55">bgrowth.app/p/{contacts.slug}</p>
                <button type="button" onClick={() => setContacts(null)} className="text-[13px] font-semibold text-navy/50 hover:text-navy">
                  Close
                </button>
              </div>
              <MemberPageSignupsList
                key={contacts.id}
                load={() => adminService.listMemberPageSignups(contacts.id)}
                remove={(id) => adminService.removeMemberPageSignup(contacts.id, id)}
                fileName={contacts.slug}
              />
            </div>
          )}

          {editing ? (
            <MemberPageBuilder
              key={editing === 'new' ? 'new' : editing.id}
              mode="team"
              page={editing === 'new' ? null : editing}
              upload={(dataUrl) => adminService.uploadMemberPageImage(dataUrl)}
              onSave={(draft) => save({ ...draft, ownerEmail, ownerManaged: ownerManaged && Boolean(ownerEmail.trim()), signupGranted })}
              onCancel={() => setEditing(null)}
              extra={
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-navy/40">Owner — BGrowth account e-mail (optional)</span>
                  <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className={INPUT} placeholder="The member sees this page’s numbers in My Page" />
                  <span className="mt-2 flex items-start gap-2 text-[13px] text-navy/70">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={ownerManaged} disabled={!ownerEmail.trim()} onChange={(e) => setOwnerManaged(e.target.checked)} />
                    <span>
                      The owner edits this page in My Business Page
                      <span className="block text-[12px] text-navy/45">
                        They need a plan with a page (Pro, Enterprise or a page plan) — without one the page goes off the site. With a “part of the page” plan they keep the model’s sections. The team can still edit it here.
                      </span>
                    </span>
                  </span>
                  <span className="mt-2 flex items-start gap-2 text-[13px] text-navy/70">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={signupGranted} onChange={(e) => setSignupGranted(e.target.checked)} />
                    <span>
                      E-mail list on for this page (given by the team)
                      <span className="block text-[12px] text-navy/45">
                        For a promotion or giveaway: the owner can add the “E-mail list” section and see the contacts even if their plan doesn’t include it.
                      </span>
                    </span>
                  </span>
                </label>
              }
            />
          ) : (
            <div className="flex justify-end">
              <Button
                type="button"
                icon={<Plus size={16} />}
                onClick={() => {
                  setNotice(null)
                  setEditing('new')
                }}
                className={SMALL_BUTTON}
              >
                New page
              </Button>
            </div>
          )}

          {data.pages.length === 0 ? (
            !editing && <EmptyState icon={SquareUser} title="No pages yet." description="Build the first one — a photo, what they do, and buttons to reach them." />
          ) : (
            <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
              {data.pages.map((p) => (
                <AdminMemberPageRow
                  key={p.id}
                  page={p}
                  onEdit={() => {
                    setNotice(null)
                    setEditing(p)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  onContacts={() => {
                    setEditing(null)
                    setNumbers(null)
                    setContacts(p)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  onNumbers={() => {
                    setEditing(null)
                    setContacts(null)
                    setNumbers(p)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  onRemove={() => setRemoving(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Delete this page?"
        description={removing ? `bgrowth.app/p/${removing.slug} stops working right away and its content is gone.` : undefined}
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
