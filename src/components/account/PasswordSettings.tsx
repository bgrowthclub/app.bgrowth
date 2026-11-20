import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../ui/Button'
import { useIdentity } from '../../modules/identity/IdentityContext'

const CARD = 'rounded-2xl border border-navy/[0.07] bg-white p-5 md:p-6'
const INPUT =
  'w-full rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[14px] text-navy placeholder:text-navy/30 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
const BUTTON = '!rounded-xl !px-4 !py-2 !text-[13px]'

// Settings → Security (20/11/2026): changing the password, moved here from
// the profile form unchanged (useIdentity().resetPassword).
export default function PasswordSettings() {
  const { user, resetPassword } = useIdentity()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passState, setPassState] = useState<{ busy?: boolean; msg?: string; err?: string }>({})

  if (!user) return null

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) return setPassState({ err: 'The two passwords don’t match.' })
    setPassState({ busy: true })
    try {
      await resetPassword(password)
      setPassword('')
      setConfirm('')
      setPassState({ msg: 'Your password was changed.' })
    } catch {
      setPassState({ err: 'Couldn’t change your password. Use at least 8 characters, different from the current one.' })
    }
  }

  return (
      <form onSubmit={savePassword} className={CARD}>
        <h2 className="font-display text-xl font-bold text-navy">Password</h2>
        <p className="mt-1 text-[14px] text-navy/55">Choose a new password with at least 8 characters.</p>
        <div className="mt-4 grid max-w-md gap-2">
          <input
            type="password"
            autoComplete="new-password"
            className={INPUT}
            value={password}
            placeholder="New password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            autoComplete="new-password"
            className={INPUT}
            value={confirm}
            placeholder="Repeat the new password"
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={passState.busy || password.length < 8 || !confirm} className={`${BUTTON} mt-3`}>
          {passState.busy ? 'Saving…' : 'Change password'}
        </Button>
        {passState.msg && <p className="mt-2 text-[13px] text-emerald-600">{passState.msg}</p>}
        {passState.err && <p className="mt-2 text-[13px] text-red-500">{passState.err}</p>}
      </form>
  )
}
