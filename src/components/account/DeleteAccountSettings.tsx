import { ShieldAlert, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import DeleteAccountDialog from './DeleteAccountDialog'
import { accountService } from '../../modules/account/accountService'
import type { DeletionRequest } from '../../modules/account/types'

const BUTTON = '!rounded-xl !px-4 !py-2.5 !text-[13px]'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Settings → Delete account: ask the team to delete the account and all
// its data, see that the request is pending, or cancel it.
export default function DeleteAccountSettings() {
  const [request, setRequest] = useState<DeletionRequest | null | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    accountService
      .getDeletionRequest()
      .then(setRequest)
      .catch(() => setRequest(null))
  }, [])

  async function submit(reason: string) {
    setBusy(true)
    setDialogError(null)
    try {
      setRequest(await accountService.requestDeletion(reason))
      setOpen(false)
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Couldn’t send the request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    setBusy(true)
    setError(null)
    try {
      setRequest(await accountService.cancelDeletion())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t cancel. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const pending = request?.status === 'pending'

  return (
    <section className="flex flex-col gap-5 rounded-[24px] border border-red-200 bg-red-50/50 p-6 sm:flex-row sm:items-start md:p-8">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-red-200 bg-white text-red-600">
        <ShieldAlert size={26} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
      <h2 className="font-display text-xl font-bold text-red-700">Danger zone</h2>
      {request === undefined ? (
        <p className="mt-2 text-[14px] text-navy/40">Loading…</p>
      ) : pending ? (
        <>
          <p className="mt-1 max-w-xl text-[14px] text-navy/60">
            You asked to delete your account on <strong>{formatDate(request.requested_at)}</strong>. Our team will complete it
            within 30 days and e-mail you when it’s done. Until then, your account keeps working.
          </p>
          <Button type="button" variant="secondary" onClick={() => void cancel()} disabled={busy} className={`${BUTTON} mt-4`}>
            {busy ? 'Cancelling…' : 'Cancel the request'}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1 max-w-xl text-[14px] text-navy/55">
            Ask us to delete your account and everything in it: your Workspaces and access, saved records, reviews, support
            conversations and newsletter subscription. We keep only the payment records the law requires.
          </p>
          {request?.status === 'rejected' && request.admin_note && (
            <p className="mt-3 max-w-xl rounded-xl bg-bg-soft px-4 py-3 text-[13px] text-navy/60">
              Your last request wasn’t completed: {request.admin_note}
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDialogError(null)
              setOpen(true)
            }}
            className={`${BUTTON} mt-4 !border-red-300 !bg-white !text-red-600`}
          >
            <Trash2 size={15} aria-hidden /> Delete account…
          </Button>
        </>
      )}
      {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
      </div>
      <DeleteAccountDialog open={open} busy={busy} error={dialogError} onSubmit={(r) => void submit(r)} onCancel={() => setOpen(false)} />
    </section>
  )
}
