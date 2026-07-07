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
    <div className="relative min-h-screen overflow-x-hidden bg-bg">
      <ScrollToTop />
      <Navbar mode={mode} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
