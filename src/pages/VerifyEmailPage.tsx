import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import AuthLayout from '../components/layout/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import VerifyEmailVerifying from '../components/auth/VerifyEmailVerifying'
import VerifyEmailVerified from '../components/auth/VerifyEmailVerified'
import VerifyEmailFailed from '../components/auth/VerifyEmailFailed'

type VerificationStatus = 'verifying' | 'verified' | 'failed'

export default function VerifyEmailPage() {
  // Captured for the future Identity verification call (see
  // VerifyEmailVerifying) and not validated here — the Identity service
  // owns token validation.
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  // TODO(identity): call verifyEmail({ token }) from src/lib/identity.ts once
  // it exists, then setStatus('verified') or setStatus('failed') based on
  // the result. Until then this intentionally never changes, so the page
  // stays in 'verifying' and the other two views below stay unreachable.
  const [status] = useState<VerificationStatus>('verifying')

  return (
    <AuthLayout>
      <SEO title="Verify Email" description="Verify your BGrowth account email address." path="/verify-email" />
      <AuthLogo />
      <div className="mt-8">
        {status === 'verified' && <VerifyEmailVerified />}
        {status === 'failed' && <VerifyEmailFailed />}
        {status === 'verifying' && <VerifyEmailVerifying />}
      </div>
    </AuthLayout>
  )
}
