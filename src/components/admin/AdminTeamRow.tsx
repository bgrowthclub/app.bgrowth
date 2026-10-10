import { INPUT, LINK_BUTTON, formatDate } from './styles'
import type { AdminTeamMember } from '../../modules/admin/types'

interface Props {
  member: AdminTeamMember
  isYou: boolean
  busy: boolean
  onRole: (role: AdminTeamMember['role']) => void
  onRemove: () => void
}

// One person in Admin → Team. Nobody changes or removes their own access.
export default function AdminTeamRow({ member, isYou, busy, onRole, onRemove }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-navy">
          {member.email}
          {isYou && <span className="ml-2 text-[12px] font-medium text-navy/40">(you)</span>}
        </p>
        <p className="mt-0.5 text-[12.5px] text-navy/45">On the team since {formatDate(member.created_at)}</p>
      </div>
      <select
        value={member.role}
        disabled={isYou || busy}
        onChange={(e) => onRole(e.target.value as AdminTeamMember['role'])}
        aria-label={`Role of ${member.email}`}
        className={`${INPUT} !w-auto !py-2`}
      >
        <option value="admin">Admin</option>
        <option value="support">Support</option>
      </select>
      {!isYou && (
        <button type="button" onClick={onRemove} disabled={busy} className={`${LINK_BUTTON} text-red-600 hover:bg-red-50`}>
          Remove
        </button>
      )}
    </div>
  )
}
