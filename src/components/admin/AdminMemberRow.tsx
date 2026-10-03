import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { AdminMemberSummary } from '../../modules/admin/types'
import { formatDate, pillClass } from './styles'

interface Props {
  member: AdminMemberSummary
}

// One member in the Admin member list — opens their record.
export default function AdminMemberRow({ member }: Props) {
  const name = member.fullName?.trim() || member.email.split('@')[0]
  return (
    <Link
      to={`/platform/admin/members/${member.id}`}
      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-bg-soft/60"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bg-soft font-display text-[14px] font-bold uppercase text-primary">
        {name.charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-navy">{name}</p>
        <p className="truncate text-[12.5px] text-navy/50">{member.email}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 md:hidden">
          <Pills member={member} />
        </div>
      </div>

      <div className="hidden flex-wrap justify-end gap-1.5 md:flex">
        <Pills member={member} />
      </div>

      <div className="hidden w-32 shrink-0 text-right text-[12px] text-navy/45 lg:block">
        <p>Joined {formatDate(member.createdAt)}</p>
        <p>{member.lastSignInAt ? `Seen ${formatDate(member.lastSignInAt)}` : 'Never signed in'}</p>
      </div>

      <ChevronRight size={16} className="shrink-0 text-navy/25" />
    </Link>
  )
}

function Pills({ member }: Props) {
  return (
    <>
      {!member.emailConfirmed && <span className={pillClass('amber')}>Email not confirmed</span>}
      {member.purchases > 0 && (
        <span className={pillClass('green')}>
          {member.purchases} {member.purchases === 1 ? 'purchase' : 'purchases'}
        </span>
      )}
      {member.trialActive && <span className={pillClass('blue')}>Trial active</span>}
      {member.activeGrants > 0 && (
        <span className={pillClass('blue')}>
          {member.activeGrants} manual {member.activeGrants === 1 ? 'access' : 'accesses'}
        </span>
      )}
      {member.purchases === 0 && !member.trialActive && member.activeGrants === 0 && (
        <span className={pillClass('gray')}>Free account</span>
      )}
    </>
  )
}
