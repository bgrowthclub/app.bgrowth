import { Link, NavLink, Outlet } from 'react-router-dom'
import { Package } from 'lucide-react'
import logo from '../assets/logo.png'

// BGrowth Studio's shell — deliberately its own, third top-level layout,
// separate from AppLayout (public marketing) and PlatformLayout (member
// Workspace). This is an internal admin tool, not a Runtime page: no
// Navbar/Footer, no member Sidebar, no BGrowth Identity™ session — see
// pages/ProductEnginePage.tsx and CLAUDE.md's routing rules for why this is
// a deliberate, explicit exception rather than a silent third layout.
//
// The sidebar below is a temporary, single-item nav added purely so the
// Product Engine is reachable without typing /studio/products directly —
// nothing else in the app links here yet. Reuses PlatformLayout's Sidebar
// visual language (same border/token classes) rather than inventing a new
// pattern; expand this the same way platformNav.ts is added to once Studio
// grows a second tool.
export default function StudioLayout() {
  return (
    <div className="flex min-h-screen bg-bg-soft">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-navy/[0.06] bg-white md:flex">
        <Link to="/studio/products" className="flex items-center gap-2.5 px-4 py-5">
          <img src={logo} alt="BGrowth" className="h-8 w-8 shrink-0 object-contain" />
          <div className="leading-tight">
            <p className="font-display text-[15px] font-bold text-navy">BGrowth Studio</p>
            <span className="rounded-full bg-bg-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
              Internal
            </span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <NavLink
            to="/studio/products"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                isActive ? 'bg-bg-soft text-primary' : 'text-navy/60 hover:bg-bg-soft hover:text-navy'
              }`
            }
          >
            <Package size={16} />
            Product Engine
          </NavLink>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-30 border-b border-navy/[0.06] bg-white/90 backdrop-blur-xl md:hidden">
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
    </div>
  )
}
