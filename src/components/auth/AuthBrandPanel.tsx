import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import AuthIllustration from './AuthIllustration'

interface Props {
  headline: string
  subtitle: string
}

// /privacy and /terms don't exist as routes yet, and Footer.tsx's existing
// links to them are a separate, pre-existing gap out of scope here. Rendered
// inert rather than pointed at an unrelated page.
// TODO: link to /privacy and /terms once those pages ship.
const LEGAL_LINKS = ['Privacy Policy', 'Terms of Service']

export default function AuthBrandPanel({ headline, subtitle }: Props) {
  return (
    <aside className="relative flex flex-col justify-between overflow-hidden bg-bg-soft px-8 py-10 lg:px-12 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />

      <Link to="/" className="relative z-10 flex w-fit items-center gap-2.5">
        <img src={logo} alt="BGrowth" className="h-8 w-8 object-contain" />
        <span className="font-display text-[17px] font-bold tracking-tight text-navy">BGrowth</span>
      </Link>

      <div className="relative z-10 py-10 lg:py-0">
        {/* Not a real heading — this is decorative brand copy in an aside,
            not part of the page's content outline. The page's one <h1>
            lives in AuthHeader, inside the actual Authentication Container. */}
        <p className="font-display text-[28px] font-bold leading-[1.15] tracking-tight text-navy lg:text-[32px]">
          {headline}
        </p>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-navy/55">{subtitle}</p>

        <AuthIllustration />
      </div>

      <div className="relative z-10 flex gap-6 text-[12.5px] text-navy/35">
        {LEGAL_LINKS.map((label) => (
          <span key={label} className="cursor-default">
            {label}
          </span>
        ))}
      </div>
    </aside>
  )
}
