import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import AuthField from '../../components/ui/AuthField'
import { useIdentity } from '../../modules/identity/IdentityContext'

// Opened from the password-reset email: its link signs the visitor in with
// a short-lived recovery session, so this route is deliberately NOT wrapped
// in GuestRoute (which would bounce that session into Workspace). Without
// a recovery session or a signed-in member there is nothing to reset —
// the link was invalid or expired.
export default function ResetPasswordPage() {
  const { resetPassword, error, status, passwordRecovery } = useIdentity()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  // Opened from an invitation (17/11/2026): the team made the account for
  // someone they gave a page to; they choose their first password here.
  const [params] = useSearchParams()
  const invited = params.get('invite') === '1'

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
        title={invited ? 'Welcome to BGrowth' : 'Choose a new password'}
        subtitle={invited ? 'Choose a password for your account — then your page is waiting for you.' : 'Almost done — pick a password you haven’t used before.'}
        footer={
          <Link to="/login" className="font-semibold text-primary">
            Back to sign in
          </Link>
        }
      >
        {status === 'loading' ? null : done ? (
          <div className="space-y-6">
            <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">Your password has been updated.</p>
            <Button to={invited ? '/platform/my-page' : '/platform/dashboard'} className="w-full !py-4 !text-[15px]">
              {invited ? 'Go to my page' : 'Continue to Workspace'}
            </Button>
          </div>
        ) : invited && status !== 'authenticated' && !passwordRecovery && !error ? (
          // The invitation's link is still being confirmed.
          <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">Opening your invitation…</p>
        ) : status !== 'authenticated' && !passwordRecovery ? (
          <div className="space-y-6">
            <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">
              {invited
                ? 'This invitation link has expired or was already used. Your account exists — request a link below to choose your password.'
                : 'This reset link is invalid or has expired. Request a new one to continue.'}
            </p>
            <Button to="/forgot-password" className="w-full !py-4 !text-[15px]">
              Request a New Link
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
