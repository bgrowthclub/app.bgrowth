import { useState } from 'react'
import type { AdminLicense } from '../../modules/admin/types'
import { INPUT, LINK_BUTTON, endOfDayIso, formatDate, pillClass, todayInput } from './styles'
import type { Tone } from './styles'

interface Props {
  license: AdminLicense
  documents: number
  busy: boolean
  onExtend: (expiresAt: string) => void
  onEnd: () => void
  onRestore: () => void
}

function describe(license: AdminLicense): { label: string; tone: Tone } {
  const trial = license.type === 'trial'
  if (license.status === 'revoked') return { label: 'Ended by admin', tone: 'red' }
  const lifetime = license.access_policy === 'lifetime' || license.expires_at === null
  if (lifetime && license.status === 'active') return { label: 'Active · never expires', tone: 'green' }
  const expired = license.status === 'expired' || (license.expires_at !== null && new Date(license.expires_at) < new Date())
  if (expired) return { label: `${trial ? 'Trial ended' : 'Expired'} ${formatDate(license.expires_at)}`, tone: 'gray' }
  return { label: `${trial ? 'Trial' : 'Active'} · ends ${formatDate(license.expires_at)}`, tone: trial ? 'blue' : 'green' }
}

const TYPE_LABEL: Record<AdminLicense['type'], string> = {
  trial: 'Free trial',
  purchased: 'Purchase',
  subscription: 'Subscription',
  enterprise: 'Enterprise',
}

// One purchase or trial on a member's record, with what an admin can do
// about it: move the end date, end it now, or restore an ended one.
export default function AdminLicenseRow({ license, documents, busy, onExtend, onEnd, onRestore }: Props) {
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState(todayInput(7))
  const status = describe(license)
  const lifetime = license.access_policy === 'lifetime'

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-navy">{license.products?.name ?? 'Removed Workspace'}</p>
          <p className="mt-0.5 text-[12.5px] text-navy/50">
            {TYPE_LABEL[license.type]} · since {formatDate(license.activated_at)} · {documents}{' '}
            {documents === 1 ? 'document' : 'documents'}
            {license.last_opened_at ? ` · opened ${formatDate(license.last_opened_at)}` : ''}
          </p>
        </div>
        <span className={pillClass(status.tone)}>{status.label}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1">
        {!lifetime && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditing((v) => !v)}
            className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}
          >
            {license.type === 'trial' ? 'Extend trial' : 'Change end date'}
          </button>
        )}
        {license.status === 'revoked' ? (
          <button type="button" disabled={busy} onClick={onRestore} className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
            Restore
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`End access to “${license.products?.name ?? 'this Workspace'}” now? Their documents are kept.`)) onEnd()
            }}
            className={`${LINK_BUTTON} text-red-600 hover:bg-red-50`}
          >
            End access
          </button>
        )}
      </div>

      {editing && (
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onExtend(endOfDayIso(date))
            setEditing(false)
          }}
        >
          <label className="text-[12.5px] text-navy/55" htmlFor={`end-${license.id}`}>
            New end date
          </label>
          <input
            id={`end-${license.id}`}
            type="date"
            min={todayInput(1)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${INPUT} !w-auto`}
            required
          />
          <button type="submit" disabled={busy} className={`${LINK_BUTTON} bg-primary text-white hover:opacity-90`}>
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}
