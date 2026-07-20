import AuthHeader from './AuthHeader'
import Button from '../ui/Button'

// Confirmation view shown once a password reset request has actually been
// sent (see ForgotPasswordForm's TODO). Not reachable yet — nothing currently
// calls the ForgotPasswordPage state that swaps to this view. Kept ready so
// wiring the Identity integration later is only a call to onSubmitted(),
// with no further UI work.
export default function ForgotPasswordSuccess() {
  return (
    <>
      <AuthHeader
        title="Check your email."
        subtitle="If an account exists for that email address, we've sent a link to reset your password."
      />
      <Button to="/login" className="w-full">
        Back to Sign In
      </Button>
    </>
  )
}
