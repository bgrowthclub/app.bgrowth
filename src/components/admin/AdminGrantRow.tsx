import { useState } from 'react'
import ConfirmDialog from '../ui/ConfirmDialog'
import type { AdminGrant } from '../../modules/admin/types'
import { LINK_BUTTON, formatDate, pillClass } from './styles'
import type { Tone } from './styles'

interface Props {
  grant: AdminGrant
  busy: boolean
  onRevoke: () => void
}

function describe(grant: AdminGrant): { label: string; tone: Tone; active: boolean } {
  if (grant.revoked_at) return { label: `Revoked ${formatDate(grant.revoked_at)}`, tone: 'gray', active: false }
  if (grant.expires_at && new Date(grant.expires_at) <= new Date()) {
    return { label: `Expired ${formatDate(grant.expires_at)}`, tone: 'gray', active: false }
  }
  return {
    label: grant.expires_at ? `Active · ends ${formatDate(grant.expires_at)}` : 'Active · no end date',
    tone: 'green',
    active: true,
  }
}

// One manual access grant (given by an admin, not bought). Grants are
// never deleted — revoking keeps the history.
export default function AdminGrantRow({ grant, busy, onRevoke }: Props) {
  const [confirming, setConfirming] = useState(false)
  const status = describe(grant)
  const target = grant.scope === 'all' ? 'All Workspaces' : grant.products?.name ?? 'Removed Workspace'

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-navy">{target}</p>
          <p className="mt-0.5 text-[12.5px] text-navy/50">
            Given {formatDate(grant.created_at)}
            {grant.granted_by ? ` by ${grant.granted_by}` : ''}
          </p>
          {grant.note && <p className="mt-1 text-[12.5px] italic text-navy/55">“{grant.note}”</p>}
        </div>
        <span className={pillClass(status.tone)}>{status.label}</span>
      </div>

      {status.active && (
        <div className="mt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(true)}
            className={`${LINK_BUTTON} text-red-600 hover:bg-red-50`}
          >
            Revoke
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        tone="danger"
        title="Revoke this access?"
        description={
          <>
            <strong className="font-semibold text-navy">{target}</strong> will close for this member right away, unless
            they bought it or have another access. Everything they filled in is kept, and you can give access again
            any time.
          </>
        }
        confirmLabel="Revoke access"
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          onRevoke()
        }}
      />
    </div>
  )
}
