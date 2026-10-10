import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'

// Routes that belong to a logged-in member's area get the Member nav.
// Everything else gets the Public nav. Auth itself is handled outside this
// project — this is purely a visual/nav-set switch based on route.
const MEMBER_ROUTE_PREFIXES = ['/my-systems', '/system/']

function isMemberRoute(pathname: string) {
  return MEMBER_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

// The five auth pages render full-screen (ui/AuthCard: brand photo + form)
// with no Navbar or Footer — still inside this layout, so the project keeps
// exactly two top-level layouts (CLAUDE.md §7). AuthCard's logo links home.
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

// Members' public pages (/p/:slug, BGrowth Find™) render the same bare way:
// the page belongs to the member, so no BGrowth menu or footer (decided by
// the user on 10/10/2026). Still inside this layout — no third layout.
const BARE_PREFIXES = ['/p/']

export default function AppLayout() {
  const { pathname } = useLocation()
  const mode = isMemberRoute(pathname) ? 'member' : 'public'

  if (AUTH_ROUTES.includes(pathname) || BARE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return (
      <div className="relative min-h-screen overflow-x-clip bg-bg">
        <ScrollToTop />
        <main>
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    // overflow-x-clip (not overflow-x-hidden): identical horizontal-bleed
    // clipping, but doesn't force the paired overflow-y axis to 'auto' the
    // way `hidden` does per the CSS Overflow spec — that pairing quirk is
    // what breaks `position: sticky` for any descendant (e.g. ProductPage's
    // sticky PurchaseCard) anywhere under this root.
    <div className="relative min-h-screen overflow-x-clip bg-bg">
      <ScrollToTop />
      <Navbar mode={mode} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
