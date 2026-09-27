import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

// Reachable either right after Register (an authenticated, not-yet-
// verified member) or by a signed-out visitor following a stale link —
// deliberately not wrapped in ProtectedRoute or GuestRoute in App.tsx.
export default function VerifyEmailPage() {
  const { user, emailVerified, verifyEmail } = useIdentity()

  return (
    <>
      <SEO title="Verify Your Email" description="Verify your BGrowth email address." path="/verify-email" />
      <AuthCard title="Verify your email" subtitle="One more step before you start.">
        {emailVerified ? (
          <div className="space-y-6">
            <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">Your email is verified.</p>
            <Button to="/platform/dashboard" className="w-full !py-4 !text-[15px]">
              Continue to Workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">
              We sent a verification link to <strong>{user?.email ?? 'your email'}</strong>. This is a simulated
              flow — no email was actually sent.
            </p>
            <Button onClick={verifyEmail} className="w-full !py-4 !text-[15px]">
              Simulate Verification
            </Button>
          </div>
        )}
      </AuthCard>
    </>
  )
}
