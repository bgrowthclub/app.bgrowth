import { Link, Outlet } from 'react-router-dom'
import logo from '../assets/logo.png'

// BGrowth Studio's shell — deliberately its own, third top-level layout,
// separate from AppLayout (public marketing) and PlatformLayout (member
// Workspace). This is an internal admin tool, not a Runtime page: no
// Navbar/Footer, no member Sidebar, no BGrowth Identity™ session — see
// pages/ProductEnginePage.tsx and CLAUDE.md's routing rules for why this is
// a deliberate, explicit exception rather than a silent third layout.
export default function StudioLayout() {
  return (
    <div className="min-h-screen bg-bg-soft">
      <header className="sticky top-0 z-30 border-b border-navy/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="container-px mx-auto flex max-w-page items-center justify-between py-4">
          <Link to="/studio/products" className="flex items-center gap-2.5">
            <img src={logo} alt="BGrowth" className="h-8 w-8 object-contain" />
            <div className="leading-tight">
              <p className="font-display text-[15px] font-bold text-navy">BGrowth Studio</p>
              <p className="text-[11px] font-medium text-navy/40">Product Engine</p>
            </div>
          </Link>
          <span className="rounded-full bg-bg-soft px-3.5 py-1.5 text-[11px] font-semibold text-primary">
            Internal
          </span>
        </div>
      </header>

      <main className="container-px mx-auto max-w-page py-8">
        <Outlet />
      </main>
    </div>
  )
}
