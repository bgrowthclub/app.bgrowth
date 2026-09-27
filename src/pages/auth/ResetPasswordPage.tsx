import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import AuthField from '../../components/ui/AuthField'
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
        title="Choose a new password"
        subtitle="Almost done — pick a password you haven’t used before."
        footer={
          <Link to="/login" className="font-semibold text-primary">
            Back to sign in
          </Link>
        }
      >
        {done ? (
          <div className="space-y-6">
            <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">
              Your password has been reset. This is a simulated flow — nothing was actually stored.
            </p>
            <Button to="/login" className="w-full !py-4 !text-[15px]">
              Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <AuthField
              id="reset-password-new"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />
            <AuthField
              id="reset-password-confirm"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            {mismatch && <p className="text-[13px] text-red-500">Passwords don&rsquo;t match.</p>}
            {error && <p className="text-[13px] text-red-500">{error}</p>}
            <Button type="submit" className="w-full !py-4 !text-[15px]" disabled={submitting}>
              {submitting ? 'Saving…' : 'Reset Password'}
            </Button>
          </form>
        )}
      </AuthCard>
    </>
  )
}
