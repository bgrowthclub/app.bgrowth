import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import AuthField from '../../components/ui/AuthField'
import { useIdentity } from '../../modules/identity/IdentityContext'

export default function ForgotPasswordPage() {
  const { requestPasswordReset, error } = useIdentity()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const ok = await requestPasswordReset(email)
    setSubmitting(false)
    if (ok) setSent(true)
  }

  return (
    <>
      <SEO title="Forgot Password" description="Reset your BGrowth password." path="/forgot-password" />
      <AuthCard
        title="Forgot password?"
        subtitle="Enter your email and we’ll send you a link to reset it."
        footer={
          <Link to="/login" className="font-semibold text-primary">
            Back to sign in
          </Link>
        }
      >
        {sent ? (
          <p className="rounded-xl bg-bg-soft p-4 text-[14px] text-navy/70">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox
            (and spam folder).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <AuthField
              id="forgot-password-email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
            />
            {error && <p className="text-[13px] text-red-500">{error}</p>}
            <Button type="submit" className="w-full !py-4 !text-[15px]" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </AuthCard>
    </>
  )
}
