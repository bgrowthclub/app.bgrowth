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

const TAGLINE = 'Knowledge. Workspaces. Real Progress.'
// No "collaboration" or "intelligent" (20/11/2026): neither is built yet.
const SENTENCE = 'Practical knowledge and interactive Workspaces to help you move forward — one goal at a time.'

// The BGrowth brand mark on the photo: the circular-masked icon (same
// treatment as Navbar — the source PNG is a square icon on a white canvas)
// plus the wordmark, larger than in the Navbar so it reads on the photo.
// Always links home — the auth screens have no Navbar, so this is the way
// back to the site.
function BrandMark({ size }: { size: 'lg' | 'md' }) {
  const lg = size === 'lg'
  return (
    <Link to="/" title="BGrowth — back to home" aria-label="BGrowth — back to home" className="inline-flex items-center gap-3">
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
// Reset Password, Verify Email) — redesigned 20/11/2026 (the owner's design,
// our own photo). Desktop: the brand photo on the left with the brand, the
// tagline and one honest sentence; the form in a white card on the right.
// Mobile: a short photo band with the logo, then the card. Rendered without
// Navbar/Footer (see AppLayout's AUTH_ROUTES). Pure layout: every page keeps
// its own form and its own useIdentity() logic.
export default function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-soft lg:flex-row">
      {/* Desktop photo panel */}
      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <img src={authHero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/35 to-navy/10" aria-hidden="true" />
        <div className="relative px-14 pt-20 xl:px-20">
          <BrandMark size="lg" />
          <p className="mt-10 font-display text-[22px] font-semibold leading-snug text-white xl:text-[26px]">{TAGLINE}</p>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/80">{SENTENCE}</p>
        </div>
      </div>

      {/* Mobile photo band */}
      <div className="relative h-40 overflow-hidden lg:hidden">
        <img src={authHero} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 to-navy/20" aria-hidden="true" />
        <div className="relative flex h-full flex-col items-center justify-center gap-2">
          <BrandMark size="md" />
          <p className="text-[12px] font-medium text-white/90">{TAGLINE}</p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-10 lg:items-center lg:py-16">
        <div className="w-full max-w-[480px] rounded-[28px] border border-navy/[0.06] bg-white px-6 py-8 shadow-soft sm:px-10 sm:py-10">
          <Link to="/" title="BGrowth — back to home" aria-label="BGrowth — back to home" className="hidden items-center gap-2.5 lg:inline-flex">
            <img src={logo} alt="" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-display text-[20px] font-bold tracking-tight text-navy">BGrowth</span>
          </Link>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-navy sm:text-[38px] lg:mt-7">
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
