import { useEffect, useMemo, useState } from 'react'
import { Package, Plus } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AdminBundleRow from '../../../components/admin/AdminBundleRow'
import BundleEditor from '../../../components/admin/BundleEditor'
import { CARD, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminBundle, AdminBundleDraft, AdminBundlesOverview } from '../../../modules/admin/types'

// Admin → Bundles: several Workspaces sold together for one price (Portal
// migration 0041). The Workspaces keep selling on their own; buying a
// bundle unlocks each of them.
export default function AdminBundlesPage() {
  const [data, setData] = useState<AdminBundlesOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  // null = closed, 'new' = creating, a bundle = editing it.
  const [editing, setEditing] = useState<AdminBundle | 'new' | null>(null)
  const [removing, setRemoving] = useState<AdminBundle | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .listBundles()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the bundles.'))
  }, [])

  const workspaces = useMemo(() => new Map((data?.workspaces ?? []).map((w) => [w.id, w])), [data])

  async function save(draft: AdminBundleDraft) {
    const saved = await adminService.saveBundle(draft)
    setData((d) =>
      d
        ? {
            ...d,
            bundles: draft.id ? d.bundles.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...d.bundles],
          }
        : d,
    )
    setEditing(null)
    setNotice(saved.status === 'published' ? `“${saved.name}” is live on the site.` : `“${saved.name}” saved as a draft.`)
  }

  async function confirmRemove() {
    if (!removing) return
    setBusy(true)
    setError(null)
    try {
      await adminService.removeBundle(removing.id)
      setData((d) => (d ? { ...d, bundles: d.bundles.filter((b) => b.id !== removing.id) } : d))
      setNotice(`“${removing.name}” was removed from the site.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t remove the bundle.')
    } finally {
      setBusy(false)
      setRemoving(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Bundles · Admin" description="Workspaces sold together." path="/platform/admin/bundles" />
      <SectionHeader
        eyebrow="Admin"
        title="Bundles"
        description="Several Workspaces sold together for one price. Each Workspace keeps selling on its own; buying the bundle unlocks all of them."
        className="mb-8"
      />

      {!data ? (
        error ? (
          <EmptyState icon={Package} title="We couldn’t load the bundles." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : (
        <div className="space-y-6">
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
          {error && <p className="text-[14px] text-red-500">{error}</p>}

          {editing ? (
            <BundleEditor
              key={editing === 'new' ? 'new' : editing.id}
              bundle={editing === 'new' ? null : editing}
              workspaces={data.workspaces}
              categories={data.categories}
              onSave={save}
              onCancel={() => setEditing(null)}
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
                disabled={data.workspaces.length < 2}
                className={SMALL_BUTTON}
              >
                New bundle
              </Button>
            </div>
          )}

          {data.bundles.length === 0 ? (
            !editing && (
              <EmptyState
                icon={Package}
                title="No bundles yet."
                description="Put 2 or more Workspaces together — for example everything someone needs to start one kind of business."
              />
            )
          ) : (
            <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
              {data.bundles.map((b) => (
                <AdminBundleRow
                  key={b.id}
                  bundle={b}
                  workspaces={workspaces}
                  onEdit={() => {
                    setNotice(null)
                    setEditing(b)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  onRemove={() => setRemoving(b)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Remove this bundle?"
        description="It leaves the site right away. Members who bought it keep every Workspace, and past sales keep its name."
        confirmLabel="Remove"
        tone="danger"
        busy={busy}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
