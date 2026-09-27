import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import { useIdentity } from '../../modules/identity/IdentityContext'

// Two moments, one route (deliberately not wrapped in ProtectedRoute or
// GuestRoute in App.tsx):
//  1. Right after Register — a guest, told to check their inbox. The
//     address arrives in router state from RegisterPage.
//  2. From the email's link — Supabase signs the member in verified, and
//     this page offers the way into Workspace.
export default function VerifyEmailPage() {
  const { status, user, emailVerified, resendVerification, error } = useIdentity()
  const location = useLocation()
  const pendingEmail = (location.state as { email?: string } | null)?.email ?? user?.email
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    if (!pendingEmail) return
    setResending(true)
    const ok = await resendVerification(pendingEmail)
    setResending(false)
    if (ok) setResent(true)
  }

  const verified = status === 'authenticated' && emailVerified

  return (
    <>
      <SEO title="Verify Your Email" description="Verify your BGrowth email address." path="/verify-email" />
      <AuthCard
        title={verified ? 'You’re all set' : 'Verify your email'}
        subtitle={verified ? 'Your BGrowth account is ready.' : 'One more step before you start.'}
        footer={
          verified ? undefined : (
            <Link to="/login" className="font-semibold text-primary">
              Back to sign in
            </Link>
          )
        }
      >
        {status === 'loading' ? null : verified ? (
          <div className="space-y-6">
            <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">Your email is verified.</p>
            <Button to="/platform/dashboard" className="w-full !py-4 !text-[15px]">
              Continue to Workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">
              We sent a verification link to <strong>{pendingEmail ?? 'your email'}</strong>. Open it to activate
              your account — check your spam folder if it isn’t in your inbox.
            </p>
            {resent && <p className="text-[13px] text-navy/60">A new link is on its way.</p>}
            {error && <p className="text-[13px] text-red-500">{error}</p>}
            {pendingEmail && (
              <Button
                variant="secondary"
                onClick={handleResend}
                disabled={resending}
                className="w-full !py-4 !text-[15px]"
              >
                {resending ? 'Sending…' : 'Resend Email'}
              </Button>
            )}
          </div>
        )}
      </AuthCard>
    </>
  )
}
