import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import logo from '../assets/logo.png'
import Button from '../components/ui/Button'
import SEO from '../components/seo/SEO'
import SignupInterests from '../components/newsletter/SignupInterests'
import { useNewsletterSignup } from '../modules/newsletter/useNewsletterSignup'
import { useIdentity } from '../modules/identity/IdentityContext'
import { usePageTexts } from '../lib/usePageTexts'

// Shown to everyone but the team while the site is closed (SiteGate).
export default function ComingSoonPage() {
  const signup = useNewsletterSignup('coming-soon')
  const t = usePageTexts()
  const { status, logout } = useIdentity()

  // Keep search engines out until launch.
  useEffect(() => {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'robots')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', 'noindex, nofollow')
    return () => tag?.setAttribute('content', 'index, follow')
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-soft px-4 py-16 text-center">
      <SEO title="Coming soon" description="BGrowth is almost here." path="/" />
      <img src={logo} alt="BGrowth" className="h-14 w-14 object-contain" />
      <p className="eyebrow mt-8">{t.text('soon.eyebrow')}</p>
      <h1 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
        {t.text('soon.title')}
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-navy/55">
        {t.text('soon.text')}
      </p>

      <form onSubmit={signup.submit} className="mt-8 flex w-full max-w-md gap-2">
        <input
          type="email"
          required
          value={signup.email}
          onChange={(e) => signup.setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="E-mail address"
          className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30"
        />
        <Button type="submit" className="shrink-0" icon={<ArrowRight size={15} />}>
          {signup.state === 'sending' ? '…' : signup.done ? 'Done' : t.text('soon.button')}
        </Button>
      </form>
      {signup.message && (
        <p role="status" className={`mt-3 max-w-md text-[13px] ${signup.state === 'error' ? 'text-red-500' : 'text-navy/55'}`}>
          {signup.message}
        </p>
      )}
      {signup.token && (
        <div className="mt-2 w-full max-w-md text-left">
          <SignupInterests token={signup.token} />
        </div>
      )}

      <p className="mt-16 text-[12.5px] text-navy/35">
        {status === 'authenticated' ? (
          <button type="button" onClick={logout} className="hover:text-navy/60">
            Sign out
          </button>
        ) : (
          <Link to="/login" className="hover:text-navy/60">
            Team sign in
          </Link>
        )}
      </p>
    </main>
  )
}
