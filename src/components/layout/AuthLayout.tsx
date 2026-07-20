import { ReactNode } from 'react'
import AuthBrandPanel from '../auth/AuthBrandPanel'
import ScrollToTop from './ScrollToTop'

interface Props {
  headline: ReactNode
  subtitle: string
  children: ReactNode
}

// Shared shell for the whole Authentication System (Login, Register, Forgot
// Password, Reset Password, Verify Email). Provides the split-screen frame —
// Brand Panel + centered Authentication Container — so each page only ever
// needs to supply its own headline/subtitle and the content of the
// container itself. Mounted outside AppLayout (see App.tsx) so it never
// carries the public site's Navbar/Footer.
//
// 60/40 rather than an even split — gives the Brand Panel (and its
// illustration) room to be the page's dominant visual, with the
// Authentication Container still comfortably centered on its own side.
export default function AuthLayout({ headline, subtitle, children }: Props) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-[3fr_2fr]">
      <ScrollToTop />
      <AuthBrandPanel headline={headline} subtitle={subtitle} />
      <main className="relative flex items-center justify-center overflow-hidden px-6 py-16 sm:px-12 lg:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="relative w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  )
}
