import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import AuthField from '../../components/ui/AuthField'
import { ArrowRight } from 'lucide-react'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

// Wrapped in GuestRoute (see App.tsx) — once register() succeeds,
// GuestRoute itself sends a freshly-registered (unverified) member to
// /verify-email on the next render, exactly like it sends an existing
// verified member to Workspace on /login. This page doesn't navigate on
// its own, so there's only one place deciding where an authenticated
// visitor of a guest route goes.
export default function RegisterPage() {
  const { register, error, status } = useIdentity()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    register({ displayName, email, password })
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
          <Button type="submit" className="w-full !py-4 !text-[15px]" disabled={status === 'loading'} icon={<ArrowRight size={18} aria-hidden="true" />}>
            {status === 'loading' ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>
      </AuthCard>
    </>
  )
}
