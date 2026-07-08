import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

export default function ResetPasswordPage() {
  const { resetPassword, error } = useIdentity()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [mismatch, setMismatch] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    setSubmitting(true)
    try {
      await resetPassword(password)
      setDone(true)
    } catch {
      // resetPassword already set the shared `error` message
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SEO title="Reset Password" description="Choose a new BGrowth password." path="/reset-password" />
      <AuthCard
        eyebrow="Almost done"
        title="Choose a new password"
        footer={
          <Link to="/login" className="font-semibold text-primary">
            Back to log in
          </Link>
        }
      >
        {done ? (
          <div className="space-y-4">
            <p className="text-[14px] text-navy/60">
              Your password has been reset. This is a simulated flow — nothing was actually stored.
            </p>
            <Button to="/login" className="w-full">
              Log In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-navy/60">New password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-navy/60">Confirm new password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
              />
            </div>
            {mismatch && <p className="text-[13px] text-red-500">Passwords don&rsquo;t match.</p>}
            {error && <p className="text-[13px] text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Reset Password'}
            </Button>
          </form>
        )}
      </AuthCard>
    </>
  )
}
