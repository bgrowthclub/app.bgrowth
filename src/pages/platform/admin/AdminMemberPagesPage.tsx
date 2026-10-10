import { useEffect, useState } from 'react'
import { Plus, SquareUser } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AdminMemberPageRow from '../../../components/admin/AdminMemberPageRow'
import MemberPageEditor from '../../../components/admin/MemberPageEditor'
import { CARD, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminMemberPageDraft, AdminMemberPagesOverview } from '../../../modules/admin/types'
import type { MemberPage } from '../../../modules/find/types'

// Admin → Pages: members' public pages at bgrowth.app/p/<address> (Portal
// migration 0044). Subscribers will build their own once Plans &
// Subscriptions exist; until then the team builds them here.
export default function AdminMemberPagesPage() {
  const [data, setData] = useState<AdminMemberPagesOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<MemberPage | 'new' | null>(null)
  const [removing, setRemoving] = useState<MemberPage | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .listMemberPages()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the pages.'))
  }, [])

  async function save(draft: AdminMemberPageDraft) {
    const saved = await adminService.saveMemberPage(draft)
    setData((d) => (d ? { ...d, pages: draft.id ? d.pages.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...d.pages] } : d))
    setEditing(null)
    setNotice(saved.status === 'published' ? `bgrowth.app/p/${saved.slug} is live.` : `${saved.display_name}’s page saved as a draft.`)
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

          {editing ? (
            <MemberPageEditor key={editing === 'new' ? 'new' : editing.id} page={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} />
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
