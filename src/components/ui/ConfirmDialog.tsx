import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

interface Props {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  // 'danger' for actions that take something away (revoke, end, delete).
  tone?: 'default' | 'danger'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// The site's own "are you sure?" dialog — replaces the browser's
// window.confirm(), which shows the site's address and can't be styled.
// Business-agnostic: callers pass the wording.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  const danger = tone === 'danger'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-glow"
      >
        <div className="flex items-start gap-4">
          {danger && (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle size={20} />
            </div>
          )}
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="font-display text-lg font-bold text-navy">
              {title}
            </h2>
            {description && <div className="mt-1.5 text-[14px] leading-relaxed text-navy/55">{description}</div>}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy} className="!rounded-xl !px-4 !py-2.5 !text-[13px]">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className={`!rounded-xl !px-4 !py-2.5 !text-[13px] ${danger ? '!bg-none !bg-red-600 hover:!bg-red-700 !shadow-softer' : ''}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
