import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import AuthLayout from '../components/layout/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthHeader from '../components/auth/AuthHeader'
import AuthFooterPrompt from '../components/auth/AuthFooterPrompt'
import ResetPasswordForm from '../components/auth/ResetPasswordForm'
import ResetPasswordSuccess from '../components/auth/ResetPasswordSuccess'

export default function ResetPasswordPage() {
  // Captured for the future Identity request (see ResetPasswordForm's TODO)
  // and not validated here — the Identity service owns token validation.
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [isSubmitted, setIsSubmitted] = useState(false)

  return (
    <AuthLayout>
      <SEO title="Reset Password" description="Create a new password for your BGrowth account." path="/reset-password" />
      <AuthLogo />
      <div className="mt-8">
        {isSubmitted ? (
          <ResetPasswordSuccess />
        ) : (
          <>
            <AuthHeader title="Create a new password." subtitle="Choose a new password for your BGrowth account." />
            <ResetPasswordForm token={token} onSubmitted={() => setIsSubmitted(true)} />
            <AuthFooterPrompt prompt="" linkLabel="Back to Sign In" linkTo="/login" />
          </>
        )}
      </div>
    </AuthLayout>
  )
}
