import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useIdentity()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await requestPasswordReset(email)
    setSubmitting(false)
    setSent(true)
  }

  return (
    <>
      <SEO title="Forgot Password" description="Reset your BGrowth password." path="/forgot-password" />
      <AuthCard
        eyebrow="Reset your password"
        title="Forgot password?"
        footer={
          <Link to="/login" className="font-semibold text-primary">
            Back to log in
          </Link>
        }
      >
        {sent ? (
          <p className="text-[14px] text-navy/60">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. This is a simulated
            flow — no email was actually sent.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-password-email" className="mb-1.5 block text-[13px] font-medium text-navy/60">Email</label>
              <input
                id="forgot-password-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </AuthCard>
    </>
  )
}
