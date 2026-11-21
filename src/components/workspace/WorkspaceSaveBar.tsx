import { AlertCircle, ArrowRight, CheckCircle2, Save } from 'lucide-react'
import { timeAgo } from '../../lib/timeAgo'

interface Props {
  /** False on a blank copy — there is nothing to save to. */
  canSave: boolean
  dirty: boolean
  savedAt: string | null
  saving: 'none' | 'save' | 'continue'
  error: string | null
  isLast: boolean
  onSave: () => void
  onContinue: () => void
}

// The bar fixed at the bottom of a Workspace (21/11/2026, the owner's design):
// the real save state on the left — the time of the last save, "Unsaved
// changes", or, on a blank copy, that a record is needed — and Save / Save &
// continue on the right. The Workspace never saves by itself.
export default function WorkspaceSaveBar({ canSave, dirty, savedAt, saving, error, isLast, onSave, onContinue }: Props) {
  const status = error ? (
    <span className="flex items-center gap-2 text-red-600">
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
      {error}
    </span>
  ) : !canSave ? (
    <span className="text-navy/55">Blank copy — create a record to save your answers.</span>
  ) : dirty ? (
    <span className="flex items-center gap-2 text-amber-700">
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
      Unsaved changes
    </span>
  ) : savedAt ? (
    <span className="flex items-center gap-2 text-navy/60">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
      <span>
        <span className="block font-semibold text-navy/80">All changes saved</span>
        <span className="block text-[12px] text-navy/45">{timeAgo(savedAt)}</span>
      </span>
    </span>
  ) : (
    <span className="text-navy/55">Not saved yet</span>
  )

  const next = isLast ? 'Finish Workspace' : canSave ? 'Save & continue' : 'Continue'
  return (
    <div className="no-print sticky bottom-0 z-20 -mx-1 mt-6 border-t border-navy/[0.07] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(16,24,40,0.25)] backdrop-blur sm:rounded-t-2xl sm:px-6" role="region" aria-label="Save">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-[13px]" role="status">
          {status}
        </div>
        <div className="flex flex-1 justify-end gap-2 sm:flex-none">
          {canSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving !== 'none'}
              className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-navy transition-colors hover:border-workspace-300 disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden />
              {saving === 'save' ? 'Saving…' : 'Save'}
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            disabled={saving !== 'none'}
            className="inline-flex items-center gap-2 rounded-xl bg-workspace-500 px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-softer transition-colors hover:bg-workspace-600 disabled:opacity-60"
          >
            {saving === 'continue' ? 'Saving…' : next}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
