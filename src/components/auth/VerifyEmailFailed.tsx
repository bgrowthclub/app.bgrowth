import AuthHeader from './AuthHeader'
import Button from '../ui/Button'
import AuthFooterPrompt from './AuthFooterPrompt'

// Failure view for VerifyEmailPage. Not reachable yet — nothing currently
// switches VerifyEmailPage's status to 'failed'. Kept ready so wiring the
// Identity integration later is only a state transition, with no further UI
// work.
export default function VerifyEmailFailed() {
  const handleRequestNewLink = () => {
    // TODO(identity): see src/lib/identity.ts — request a new verification
    // email once the Identity service exists. Not implemented yet; this
    // intentionally does nothing further.
  }

  return (
    <>
      <AuthHeader title="Verification failed." subtitle="This verification link is invalid or has expired." />
      <Button type="button" className="w-full" onClick={handleRequestNewLink}>
        Request a new verification email
      </Button>
      <AuthFooterPrompt prompt="" linkLabel="Back to Sign In" linkTo="/login" />
    </>
  )
}
