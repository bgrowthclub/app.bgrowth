import { useState } from 'react'
import SEO from '../components/seo/SEO'
import AuthLayout from '../components/layout/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthHeader from '../components/auth/AuthHeader'
import AuthFooterPrompt from '../components/auth/AuthFooterPrompt'
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm'
import ForgotPasswordSuccess from '../components/auth/ForgotPasswordSuccess'

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  return (
    <AuthLayout>
      <SEO title="Reset Password" description="Reset your BGrowth account password." path="/forgot-password" />
      <AuthLogo />
      <div className="mt-8">
        {isSubmitted ? (
          <ForgotPasswordSuccess />
        ) : (
          <>
            <AuthHeader
              title="Reset your password."
              subtitle="Enter the email address associated with your account and we'll send you a password reset link."
            />
            <ForgotPasswordForm onSubmitted={() => setIsSubmitted(true)} />
            <AuthFooterPrompt prompt="Remember your password?" linkLabel="Sign In" linkTo="/login" />
          </>
        )}
      </div>
    </AuthLayout>
  )
}
