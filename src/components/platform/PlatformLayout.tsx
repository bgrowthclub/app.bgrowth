import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import ScrollToTop from '../layout/ScrollToTop'
import PageContainer from '../layout/PageContainer'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

// The permanent Platform Shell — the shared foundation every authenticated
// BGrowth product (Club, App, Academy, Find, Marketplace, AI, ...) mounts
// into. Distinct from the marketing AppLayout: this shell is Sidebar + TopBar
// + Content, not Navbar + Footer. See ARCHITECTURE.md.
export default function PlatformLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      <ScrollToTop />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
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
  )
}
