import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import AuthField from '../../components/ui/AuthField'
import { ArrowRight } from 'lucide-react'
import { useIdentity } from '../../modules/identity/IdentityContext'

// Wrapped in GuestRoute (see App.tsx). A new account is NOT signed in until
// its email is verified, so the visitor is still a guest after register()
// succeeds — this page sends them to /verify-email itself (GuestRoute only
// decides where *authenticated* visitors go, so the two never race).
// The address travels in router state so Verify Email can offer "Resend".
export default function RegisterPage() {
  const { register, error, busy } = useIdentity()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const created = await register({ displayName, email, password })
    if (created) navigate('/verify-email', { state: { email: email.trim() } })
  }

  return (
    <>
      <SEO title="Sign Up" description="Create a BGrowth account." path="/register" />
      <AuthCard
        title="Create your account"
        subtitle="Start your BGrowth journey in less than a minute."
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthField
            id="register-name"
            label="Name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={displayName}
            onChange={setDisplayName}
          />
          <AuthField
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
          />
          <AuthField
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={setPassword}
          />
          {error && <p className="text-[13px] text-red-500">{error}</p>}
          <Button type="submit" className="w-full !py-4 !text-[15px]" disabled={busy} icon={<ArrowRight size={18} aria-hidden="true" />}>
            {busy ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>
      </AuthCard>
    </>
  )
}
