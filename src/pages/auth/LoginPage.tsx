import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import AuthCard from '../../components/ui/AuthCard'
import Button from '../../components/ui/Button'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

// Wrapped in GuestRoute (see App.tsx) — once login() succeeds, GuestRoute
// itself redirects into Workspace on the next render. This page doesn't
// navigate on its own, so there's only one place deciding where an
// authenticated visitor of a guest route goes.
export default function LoginPage() {
  const { login, error, status } = useIdentity()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login({ email, password, rememberMe })
  }

  return (
    <>
      <SEO title="Log In" description="Log in to your BGrowth account." path="/login" />
      <AuthCard
        eyebrow="Welcome back"
        title="Log in to BGrowth"
        footer={
          <>
            Don&rsquo;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary">
              Sign up
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-navy/60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-navy/60">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <label className="flex items-center gap-2 text-navy/60">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-navy/20 text-primary focus:ring-primary/30"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-semibold text-primary">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-[13px] text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Logging in…' : 'Log In'}
          </Button>
        </form>
      </AuthCard>
    </>
  )
}
