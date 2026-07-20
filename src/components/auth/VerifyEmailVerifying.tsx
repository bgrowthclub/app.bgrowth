import { Loader2 } from 'lucide-react'
import AuthHeader from './AuthHeader'

// Default state for VerifyEmailPage — the only currently reachable view. See
// VerifyEmailPage for how the token is captured and where the future
// Identity verification call will decide whether to switch to
// VerifyEmailVerified or VerifyEmailFailed instead.
export default function VerifyEmailVerifying() {
  return (
    <>
      <AuthHeader
        title="Verify your email."
        subtitle="We're verifying your email address so you can access your BGrowth account."
      />
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-2 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <div>
          <p className="font-display text-[15px] font-semibold text-navy">Verifying your email...</p>
          <p className="mt-1 text-[14.5px] text-navy/55">Please wait while we confirm your account.</p>
        </div>
      </div>
    </>
  )
}
