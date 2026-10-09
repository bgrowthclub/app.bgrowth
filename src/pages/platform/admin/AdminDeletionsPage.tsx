import { useCallback, useEffect, useState } from 'react'
import { UserX } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import AdminDeletionRow from '../../../components/admin/AdminDeletionRow'
import { CARD, INPUT, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminDeletionRequest } from '../../../modules/admin/types'

type Action = { kind: 'complete' | 'reject'; request: AdminDeletionRequest }

// Admin → Deletions: members' requests to delete their account and data.
// Completing one deletes everything for good (after typing their e-mail);
// "Not now" keeps the account and e-mails the member the reason.
export default function AdminDeletionsPage() {
  const [requests, setRequests] = useState<AdminDeletionRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(() => {
    adminService
      .listDeletionRequests()
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the requests.'))
  }, [])
  useEffect(load, [load])

  function open(kind: Action['kind'], request: AdminDeletionRequest) {
    setAction({ kind, request })
    setTyped('')
    setActionError(null)
    setNotice(null)
  }

  async function confirm() {
    if (!action) return
    setBusy(true)
    setActionError(null)
    try {
      if (action.kind === 'complete') {
        await adminService.completeDeletion(action.request.id, typed)
        setNotice(`Deleted ${action.request.email}. A confirmation e-mail was sent.`)
      } else {
        await adminService.rejectDeletion(action.request.id, typed)
        setNotice(`Kept the account of ${action.request.email}. The member got your note by e-mail.`)
      }
      setAction(null)
      load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const pending = (requests ?? []).filter((r) => r.status === 'pending')
  const past = (requests ?? []).filter((r) => r.status !== 'pending')
  const ready =
    action?.kind === 'complete'
      ? typed.trim().toLowerCase() === (action.request.email ?? '').toLowerCase()
      : typed.trim().length > 0

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Deletions · Admin" description="Account deletion requests." path="/platform/admin/deletions" />
      <SectionHeader
        eyebrow="Admin"
        title="Deletions"
        description="Members who asked to delete their account and data. Complete each one within 30 days — it can’t be undone."
        className="mb-8"
      />

      {notice && <p role="status" className="mb-4 text-[14px] font-medium text-primary">{notice}</p>}

      {!requests ? (
        error ? (
          <EmptyState icon={UserX} title="We couldn’t load the requests." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-navy">Waiting ({pending.length})</h2>
            {pending.length === 0 ? (
              <EmptyState icon={UserX} title="No requests waiting." description="When a member asks to delete their account, it shows up here." />
            ) : (
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {pending.map((r) => (
                  <AdminDeletionRow key={r.id} request={r} onComplete={() => open('complete', r)} onReject={() => open('reject', r)} />
                ))}
              </div>
            )}
          </div>
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-lg font-bold text-navy">History</h2>
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {past.map((r) => (
                  <AdminDeletionRow key={r.id} request={r} onComplete={() => undefined} onReject={() => undefined} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {action && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={busy ? undefined : () => setAction(null)} />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-xl3 bg-white p-6 shadow-glow">
            {action.kind === 'complete' ? (
              <>
                <h2 className="font-display text-lg font-bold text-navy">Delete this account for good?</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-navy/60">
                  Deletes the account of <strong>{action.request.email}</strong> and everything linked to it — licenses, access,
                  saved records, reviews, support conversations, newsletter and Stripe customer profile. Payment records stay at
                  Stripe. This can’t be undone.
                </p>
                <label htmlFor="del-confirm" className="mt-4 block text-sm font-medium text-navy/75">
                  Type the member’s e-mail to confirm
                </label>
                <input id="del-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={`${INPUT} mt-1.5`} />
              </>
            ) : (
              <>
                <h2 className="font-display text-lg font-bold text-navy">Keep this account for now?</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-navy/60">
                  For example, an open refund or a legal reason. Write why — the member gets it by e-mail and can reply.
                </p>
                <label htmlFor="del-note" className="mt-4 block text-sm font-medium text-navy/75">
                  Reason
                </label>
                <textarea id="del-note" rows={3} value={typed} onChange={(e) => setTyped(e.target.value)} className={`${INPUT} mt-1.5 resize-y`} />
              </>
            )}
            {actionError && <p className="mt-3 text-[13px] text-red-500">{actionError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAction(null)} disabled={busy} className={SMALL_BUTTON}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void confirm()}
                disabled={!ready || busy}
                className={`${SMALL_BUTTON} ${action.kind === 'complete' ? '!bg-none !bg-red-600 hover:!bg-red-700' : ''}`}
              >
                {busy ? 'Working…' : action.kind === 'complete' ? 'Delete account' : 'Send and keep account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
