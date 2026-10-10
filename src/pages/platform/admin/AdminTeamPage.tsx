import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AdminTeamRow from '../../../components/admin/AdminTeamRow'
import { CARD, INPUT, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import { useIdentity } from '../../../modules/identity/IdentityContext'
import type { AdminTeamMember } from '../../../modules/admin/types'

const ROLES = [
  { name: 'Admin', text: 'Everything in the Admin area, including sales, the catalog, the newsletter, account deletions and this team list.' },
  {
    name: 'Support',
    text: 'Answers support, sees members and their documents, resends the confirmation e-mail, gives or extends access and trials, and reads reviews.',
  },
]

// Admin → Team: who can use the Admin area and with which role (Portal
// migration 0042). The person must already have a BGrowth account.
export default function AdminTeamPage() {
  const { user } = useIdentity()
  const [team, setTeam] = useState<AdminTeamMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminTeamMember['role']>('support')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState<AdminTeamMember | null>(null)

  useEffect(() => {
    adminService
      .listTeam()
      .then(setTeam)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the team.'))
  }, [])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function add(e: FormEvent) {
    e.preventDefault()
    void run(async () => {
      const member = await adminService.addTeamMember(email.trim(), role)
      setTeam((list) => [...(list ?? []), member])
      setEmail('')
      setNotice(`${member.email} can now use the Admin area as ${member.role === 'admin' ? 'Admin' : 'Support'}.`)
    })
  }

  function changeRole(member: AdminTeamMember, next: AdminTeamMember['role']) {
    void run(async () => {
      await adminService.setTeamRole(member.user_id, next)
      setTeam((list) => (list ?? []).map((m) => (m.user_id === member.user_id ? { ...m, role: next } : m)))
      setNotice(`${member.email} is now ${next === 'admin' ? 'an Admin' : 'Support'}.`)
    })
  }

  function confirmRemove() {
    const member = removing
    if (!member) return
    void run(async () => {
      await adminService.removeTeamMember(member.user_id)
      setTeam((list) => (list ?? []).filter((m) => m.user_id !== member.user_id))
      setNotice(`${member.email} no longer has access to the Admin area.`)
    }).finally(() => setRemoving(null))
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Team · Admin" description="Who can use the Admin area." path="/platform/admin/team" />
      <SectionHeader
        eyebrow="Admin"
        title="Team"
        description="Who can use the Admin area, and what each person can do there. Every change is recorded in Activity."
        className="mb-8"
      />

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        {ROLES.map((r) => (
          <div key={r.name} className={`${CARD} p-5`}>
            <p className="text-[14px] font-bold text-navy">{r.name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-navy/55">{r.text}</p>
          </div>
        ))}
      </div>

      {notice && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 text-[14px] text-red-500">{error}</p>}

      {!team ? (
        !error && <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
      ) : (
        <div className="space-y-6">
          <form onSubmit={add} className={`${CARD} flex flex-wrap items-end gap-3 p-5`}>
            <label className="min-w-[220px] flex-1">
              <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-navy/40">Add a person</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Their BGrowth account e-mail"
                className={INPUT}
              />
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value as AdminTeamMember['role'])} aria-label="Role" className={`${INPUT} !w-auto`}>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" disabled={busy || !email.trim()} className={SMALL_BUTTON}>
              Add
            </Button>
          </form>

          {team.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No one yet." description="Add the people who help run BGrowth." />
          ) : (
            <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
              {team.map((m) => (
                <AdminTeamRow
                  key={m.user_id}
                  member={m}
                  isYou={m.user_id === user?.id}
                  busy={busy}
                  onRole={(next) => changeRole(m, next)}
                  onRemove={() => setRemoving(m)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Remove from the team?"
        description={removing ? `${removing.email} keeps their BGrowth account, but loses access to the Admin area right away.` : undefined}
        confirmLabel="Remove"
        tone="danger"
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
