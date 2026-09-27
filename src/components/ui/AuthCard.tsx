import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import authHero from '../../assets/auth/auth-hero.webp'

interface Props {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

const TAGLINE = 'Knowledge · Workspaces · Real Progress'

// The BGrowth brand mark on the photo: the circular-masked icon (same
// treatment as Navbar — the source PNG is a square icon on a white canvas)
// plus the wordmark, larger than in the Navbar so it reads on the photo.
// Always links home — the auth screens have no Navbar, so this is the way
// back to the site.
function BrandMark({ size }: { size: 'lg' | 'md' }) {
  const lg = size === 'lg'
  return (
    <Link to="/" aria-label="BGrowth — back to home" className="inline-flex items-center gap-3">
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-softer ${lg ? 'h-14 w-14' : 'h-10 w-10'}`}
      >
        <img src={logo} alt="" className="h-full w-full scale-110 object-cover" />
      </span>
      <span className={`font-display font-bold tracking-tight text-white ${lg ? 'text-[40px]' : 'text-[26px]'}`}>
        BGrowth
      </span>
    </Link>
  )
}

// Shared frame for the five auth pages (Login, Register, Forgot Password,
// Reset Password, Verify Email). Desktop: the brand photo on the left, the
// form on the right. Mobile: no split — a short photo band carrying the
// logo, then the form. Rendered without Navbar/Footer (see AppLayout's
// AUTH_ROUTES). Pure layout: every page keeps its own form and its own
// useIdentity() logic.
export default function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-bg lg:flex-row">
      {/* Desktop photo panel */}
      <div className="relative hidden lg:block lg:w-1/2">
        <img src={authHero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/10 to-transparent" aria-hidden="true" />
        <div className="relative px-14 pt-20 xl:px-20">
          <BrandMark size="lg" />
          <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.32em] text-white/85">{TAGLINE}</p>
        </div>
      </div>

      {/* Mobile photo band */}
      <div className="relative h-40 overflow-hidden lg:hidden">
        <img src={authHero} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 to-navy/10" aria-hidden="true" />
        <div className="relative flex h-full flex-col items-center justify-center gap-2">
          <BrandMark size="md" />
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/85">{TAGLINE}</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-start justify-center px-6 py-10 sm:px-10 lg:items-center lg:py-16">
        <div className="w-full max-w-[440px]">
          <h1 className="font-display text-[32px] font-bold leading-tight tracking-tight text-navy sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-2 text-[15px] text-navy/55 sm:text-[16px]">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-[14px] text-navy/55">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
