import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { CARD, SMALL_BUTTON } from './styles'
import { adminService } from '../../modules/admin/adminService'

type Preview = Awaited<ReturnType<typeof adminService.listUnconfirmed>>

// Admin → Members: delete accounts that never confirmed their e-mail more
// than 14 days after signing up (mostly bot sign-ups, Sprint 87). Shows the
// list first; accounts with anything bought or given are never included.
export default function UnconfirmedCleanup({ onClose }: { onClose: () => void }) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setError(null)
    setPreview(null)
    try {
      setPreview(await adminService.listUnconfirmed())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t load the list.')
    }
  }

  async function run() {
    setConfirming(false)
    setBusy(true)
    setError(null)
    try {
      const result = await adminService.cleanupUnconfirmed()
      setMessage(
        `Deleted ${result.deleted} ${result.deleted === 1 ? 'account' : 'accounts'}.` +
          (result.remaining ? ` ${result.remaining} left — run it again to continue.` : ''),
      )
      setPreview(await adminService.listUnconfirmed())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t delete the accounts.')
    } finally {
      setBusy(false)
    }
  }

  const total = preview?.total ?? 0
  return (
    <div className={`${CARD} mb-6 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[15px] font-bold text-navy">Accounts never confirmed</p>
          <p className="mt-1 text-[13px] text-navy/50">
            Signed up more than {preview?.days ?? 14} days ago and never confirmed their e-mail — mostly robots. Accounts with anything bought or
            given by the team are never included. Their newsletter subscription goes too.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-navy/40 hover:text-navy" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {!preview && !error && <p className="mt-4 text-[13px] text-navy/40">Looking for them…</p>}
      {preview && (
        <>
          <p className="mt-4 text-[14px] font-semibold text-navy">
            {total === 0 ? 'None right now.' : `${total} ${total === 1 ? 'account' : 'accounts'}`}
          </p>
          {total > 0 && (
            <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl bg-bg-soft px-4 py-2 text-[13px] text-navy/70">
              {preview.accounts.map((a) => (
                <li key={a.id} className="flex justify-between gap-3 py-1">
                  <span className="truncate">{a.email}</span>
                  <span className="shrink-0 text-navy/40">{new Date(a.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
          {total > 0 && (
            <Button type="button" onClick={() => setConfirming(true)} disabled={busy} className={`mt-4 ${SMALL_BUTTON}`} icon={<Trash2 size={15} />}>
              {busy ? 'Deleting…' : `Delete ${Math.min(total, 200)} ${total === 1 ? 'account' : 'accounts'}`}
            </Button>
          )}
        </>
      )}
      {message && <p className="mt-3 text-[13px] font-medium text-emerald-600">{message}</p>}
      {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}

      <ConfirmDialog
        open={confirming}
        tone="danger"
        title="Delete these accounts?"
        description={`${Math.min(total, 200)} unconfirmed ${total === 1 ? 'account' : 'accounts'} will be deleted for good. They get no e-mail.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={() => void run()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
