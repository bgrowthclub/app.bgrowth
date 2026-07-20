import AuthHeader from './AuthHeader'
import Button from '../ui/Button'

// Success view for VerifyEmailPage. Not reachable yet — nothing currently
// switches VerifyEmailPage's status to 'verified'. Kept ready so wiring the
// Identity integration later is only a state transition, with no further UI
// work.
export default function VerifyEmailVerified() {
  return (
    <>
      <AuthHeader
        title="Email verified."
        subtitle="Your email has been successfully verified. You can now sign in to your BGrowth account."
      />
      <Button to="/login" className="w-full">
        Continue to Sign In
      </Button>
    </>
  )
}
