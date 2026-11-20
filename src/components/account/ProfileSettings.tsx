import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../ui/Button'
import { useIdentity } from '../../modules/identity/IdentityContext'

const CARD = 'rounded-2xl border border-navy/[0.07] bg-white p-5 md:p-6'
const INPUT =
  'w-full rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[14px] text-navy placeholder:text-navy/30 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
const BUTTON = '!rounded-xl !px-4 !py-2 !text-[13px]'

// Settings → Profile (Sprint 110; a tab of Settings since Sprint 313): the
// member's name and e-mail address, through BGrowth Identity™ (updateName /
// changeEmail). The password moved to PasswordSettings (Settings → Security).
export default function ProfileSettings() {
  const { user, updateName, changeEmail } = useIdentity()

  const [name, setName] = useState(user?.displayName ?? '')
  const [nameState, setNameState] = useState<{ busy?: boolean; msg?: string; err?: string }>({})

  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState<{ busy?: boolean; msg?: string; err?: string }>({})


  if (!user) return null

  async function saveName(e: FormEvent) {
    e.preventDefault()
    setNameState({ busy: true })
    try {
      await updateName(name.trim())
      setNameState({ msg: 'Saved.' })
    } catch (err) {
      setNameState({ err: err instanceof Error ? err.message : 'Couldn’t save your name.' })
    }
  }

  async function saveEmail(e: FormEvent) {
    e.preventDefault()
    if (email.trim().toLowerCase() === user?.email.toLowerCase()) return setEmailState({ err: 'That is already your e-mail address.' })
    setEmailState({ busy: true })
    const sent = await changeEmail(email)
    setEmailState(
      sent
        ? { msg: `We sent a confirmation link to ${email.trim()}. Your e-mail changes when you open it (check your current inbox too).` }
        : { err: 'Couldn’t change your e-mail address. Check it and try again.' },
    )
    if (sent) setEmail('')
  }


  return (
    <div className="space-y-6">
      <form onSubmit={saveName} className={CARD}>
        <h2 className="font-display text-xl font-bold text-navy">Your name</h2>
        <p className="mt-1 text-[14px] text-navy/55">How we greet you on the site and in our e-mails.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input className={`${INPUT} max-w-sm`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
          <Button type="submit" disabled={nameState.busy || name.trim().length < 2 || name.trim() === user.displayName} className={BUTTON}>
            {nameState.busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
        {nameState.msg && <p className="mt-2 text-[13px] text-emerald-600">{nameState.msg}</p>}
        {nameState.err && <p className="mt-2 text-[13px] text-red-500">{nameState.err}</p>}
      </form>

      <form onSubmit={saveEmail} className={CARD}>
        <h2 className="font-display text-xl font-bold text-navy">E-mail address</h2>
        <p className="mt-1 text-[14px] text-navy/55">
          You sign in with <strong className="text-navy">{user.email}</strong>. To change it, enter the new address — we’ll send a link to confirm it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            className={`${INPUT} max-w-sm`}
            value={email}
            placeholder="new@email.com"
            onChange={(e) => setEmail(e.target.value)}
            aria-label="New e-mail address"
          />
          <Button type="submit" variant="secondary" disabled={emailState.busy || !email.trim()} className={BUTTON}>
            {emailState.busy ? 'Sending…' : 'Change e-mail'}
          </Button>
        </div>
        {emailState.msg && <p className="mt-2 max-w-xl text-[13px] text-emerald-600">{emailState.msg}</p>}
        {emailState.err && <p className="mt-2 text-[13px] text-red-500">{emailState.err}</p>}
      </form>

    </div>
  )
}
