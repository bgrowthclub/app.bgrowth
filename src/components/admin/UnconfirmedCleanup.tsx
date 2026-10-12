import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { CARD, INPUT, SMALL_BUTTON } from './styles'
import { adminService } from '../../modules/admin/adminService'

type Preview = Awaited<ReturnType<typeof adminService.listUnconfirmed>>

// Admin → Members: delete accounts that never confirmed their e-mail (mostly
// bot sign-ups, Sprint 87). The admin picks how old (days) and which ones —
// all of them, or just the ones ticked. Accounts with anything bought or
// given, or on the team, are never listed.
export default function UnconfirmedCleanup({ onClose }: { onClose: () => void }) {
  const [days, setDays] = useState(14)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load(forDays = days) {
    setError(null)
    setPreview(null)
    setSelected(new Set())
    try {
      setPreview(await adminService.listUnconfirmed(forDays))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t load the list.')
    }
  }

  useEffect(() => {
    void load(14)
  }, [])

  const total = preview?.total ?? 0
  const shown = preview?.accounts ?? []
  const count = selected.size || Math.min(total, 200)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function run() {
    setConfirming(false)
    setBusy(true)
    setError(null)
    try {
      const result = await adminService.cleanupUnconfirmed(days, selected.size ? [...selected] : undefined)
      setMessage(
        `Deleted ${result.deleted} ${result.deleted === 1 ? 'account' : 'accounts'}.` +
          (result.remaining ? ` ${result.remaining} still on the list.` : ''),
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t delete the accounts.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${CARD} mb-6 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[15px] font-bold text-navy">Accounts never confirmed</p>
          <p className="mt-1 text-[13px] text-navy/50">
            Never confirmed their e-mail — mostly robots. Accounts with anything bought or given by the team are never listed. Their newsletter
            subscription goes too, and they get no e-mail.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-navy/40 hover:text-navy" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <form
        className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-navy/70"
        onSubmit={(e) => {
          e.preventDefault()
          void load()
        }}
      >
        Signed up more than
        <input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
          className={`${INPUT} !w-20 !py-1.5`}
          aria-label="Days"
        />
        days ago
        <Button type="submit" variant="secondary" className={SMALL_BUTTON}>
          Show
        </Button>
      </form>

      {!preview && !error && <p className="mt-4 text-[13px] text-navy/40">Looking for them…</p>}
      {preview && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] font-semibold text-navy">
              {total === 0 ? 'None right now.' : `${total} ${total === 1 ? 'account' : 'accounts'}`}
              {selected.size > 0 && <span className="font-normal text-navy/50"> · {selected.size} selected</span>}
            </p>
            {total > 0 && (
              <button
                type="button"
                onClick={() => setSelected(selected.size === shown.length ? new Set() : new Set(shown.map((a) => a.id)))}
                className="text-[13px] font-semibold text-primary hover:underline"
              >
                {selected.size === shown.length ? 'Clear selection' : 'Select all'}
              </button>
            )}
          </div>
          {total > 0 && (
            <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl bg-bg-soft px-4 py-2 text-[13px] text-navy/70">
              {shown.map((a) => (
                <li key={a.id}>
                  <label className="flex cursor-pointer items-center gap-3 py-1">
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />
                    <span className="min-w-0 flex-1 truncate">{a.email}</span>
                    <span className="shrink-0 text-navy/40">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {total > 0 && (
            <Button type="button" onClick={() => setConfirming(true)} disabled={busy} className={`mt-4 ${SMALL_BUTTON}`} icon={<Trash2 size={15} />}>
              {busy ? 'Deleting…' : selected.size ? `Delete ${selected.size} selected` : `Delete ${count} ${count === 1 ? 'account' : 'accounts'}`}
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
        description={`${count} unconfirmed ${count === 1 ? 'account' : 'accounts'} will be deleted for good. They get no e-mail.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={() => void run()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
