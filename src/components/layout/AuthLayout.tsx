import { ReactNode } from 'react'
import AuthBrandPanel from '../auth/AuthBrandPanel'
import ScrollToTop from './ScrollToTop'

interface Props {
  headline: string
  subtitle: string
  children: ReactNode
}

// Shared shell for the whole Authentication System (Login, Register, Forgot
// Password, Reset Password, Verify Email). Provides the split-screen frame —
// Brand Panel + centered Authentication Container — so each page only ever
// needs to supply its own headline/subtitle and the content of the
// container itself. Mounted outside AppLayout (see App.tsx) so it never
// carries the public site's Navbar/Footer.
export default function AuthLayout({ headline, subtitle, children }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <ScrollToTop />
      <AuthBrandPanel headline={headline} subtitle={subtitle} />
      <main className="flex items-center justify-center px-6 py-12 sm:px-10 lg:py-12">
        <div className="w-full max-w-[430px]">{children}</div>
      </main>
    </div>
  )
}
