import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
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
        eyebrow="Get started"
        title="Create your BGrowth account"
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary">
              Log in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="mb-1.5 block text-[13px] font-medium text-navy/60">Name</label>
            <input
              id="register-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-1.5 block text-[13px] font-medium text-navy/60">Email</label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="mb-1.5 block text-[13px] font-medium text-navy/60">Password</label>
            <input
              id="register-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
          </div>
          {error && <p className="text-[13px] text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>
      </AuthCard>
    </>
  )
}
