import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import ScrollToTop from '../layout/ScrollToTop'
import PageContainer from '../layout/PageContainer'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { ComingSoonModalProvider } from './ComingSoonModalProvider'

// Responsive decision for the sidebar (Milestone 4.1 review):
// - Desktop (>=1024px, "lg"): persistent, expanded by default.
// - Tablet (768–1023px, "md"–"lg"): still persistent (not hidden behind a
//   hamburger like mobile) but defaults to its collapsed, icon-only width so
//   it doesn't crowd out content — the same pattern Linear/Notion/Vercel use.
// - Mobile (<768px, "md"): hidden entirely behind the TopBar's hamburger,
//   shown as an overlay drawer (see Sidebar.tsx).
// The user's own Collapse/Expand toggle always wins over this default, for
// the rest of the session, once they've used it.
const TABLET_QUERY = '(min-width: 768px) and (max-width: 1023px)'

export default function PlatformLayout() {
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(TABLET_QUERY).matches)
  const [mobileOpen, setMobileOpen] = useState(false)
  const userToggledRef = useRef(false)

  useEffect(() => {
    const mql = window.matchMedia(TABLET_QUERY)
    const syncToBreakpoint = (e: MediaQueryList | MediaQueryListEvent) => {
      if (!userToggledRef.current) setCollapsed(e.matches)
    }
    mql.addEventListener('change', syncToBreakpoint)
    return () => mql.removeEventListener('change', syncToBreakpoint)
  }, [])

  const handleToggleCollapsed = () => {
    userToggledRef.current = true
    setCollapsed((v) => !v)
  }

  return (
    <ComingSoonModalProvider>
      <div className="flex min-h-screen bg-bg">
        <ScrollToTop />
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={handleToggleCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMobileSidebar={() => setMobileOpen(true)} />
          <main className="flex-1">
            <PageContainer width="page" className="py-10">
              <Outlet />
            </PageContainer>
          </main>
        </div>
      </div>
    </ComingSoonModalProvider>
  )
}
