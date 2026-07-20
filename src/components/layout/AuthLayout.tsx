import { ReactNode } from 'react'
import HeroImage from '../auth/HeroImage'
import ScrollToTop from './ScrollToTop'

interface Props {
  heroImageSrc: string
  heroImageAlt?: string
  children: ReactNode
}

// Shared shell for the whole Authentication System (Login, Register, Forgot
// Password, Reset Password, Verify Email). A full-bleed HeroImage behind a
// single floating Authentication Container — every page supplies its own
// hero photo and its own container content (logo, heading, form, footer);
// nothing about this composition needs to change to add a page. Mounted
// outside AppLayout (see App.tsx) so it never carries the public site's
// Navbar/Footer.
export default function AuthLayout({ heroImageSrc, heroImageAlt, children }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ScrollToTop />
      <HeroImage src={heroImageSrc} alt={heroImageAlt} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 lg:justify-end lg:px-16 lg:py-12 xl:px-24">
        <div className="w-full max-w-[440px] rounded-xl3 bg-white p-8 shadow-glow sm:p-10 lg:p-12">{children}</div>
      </div>
    </div>
  )
}
