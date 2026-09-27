import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import AuthField from '../../components/ui/AuthField'
import { ArrowRight } from 'lucide-react'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

// Wrapped in GuestRoute (see App.tsx) — once login() succeeds, GuestRoute
// itself redirects into Workspace on the next render. This page doesn't
// navigate on its own, so there's only one place deciding where an
// authenticated visitor of a guest route goes.
export default function LoginPage() {
  const { login, error, status } = useIdentity()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // No "Remember me" checkbox in the approved design — sessions are
  // remembered by default.
  const rememberMe = true

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login({ email, password, rememberMe })
  }

  return (
    <>
      <SEO title="Log In" description="Log in to your BGrowth account." path="/login" />
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your BGrowth account."
        footer={
          <>
            Don&rsquo;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary">
              Create one
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthField
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
          />
          <AuthField
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
            labelAside={
              <Link to="/forgot-password" className="font-medium text-primary">
                Forgot password?
              </Link>
            }
          />
          {error && <p className="text-[13px] text-red-500">{error}</p>}
          <Button type="submit" className="w-full !py-4 !text-[15px]" disabled={status === 'loading'} icon={<ArrowRight size={18} aria-hidden="true" />}>
            {status === 'loading' ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </AuthCard>
    </>
  )
}
