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

export default function AppLayout() {
  const { pathname } = useLocation()
  const mode = isMemberRoute(pathname) ? 'member' : 'public'

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
