import AuthHeader from './AuthHeader'
import Button from '../ui/Button'

// Confirmation view shown once the password has actually been reset (see
// ResetPasswordForm's TODO). Not reachable yet — nothing currently calls the
// ResetPasswordPage state that swaps to this view. Kept ready so wiring the
// Identity integration later is only a call to onSubmitted(), with no
// further UI work.
export default function ResetPasswordSuccess() {
  return (
    <>
      <AuthHeader
        title="Password updated."
        subtitle="Your password has been reset. You can now sign in with your new password."
      />
      <Button to="/login" className="w-full">
        Back to Sign In
      </Button>
    </>
  )
}
