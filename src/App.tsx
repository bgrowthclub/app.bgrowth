import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import BrowseSystems from './pages/BrowseSystems'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import SystemOverviewPage from './pages/SystemOverviewPage'
import SystemModulePage from './pages/SystemModulePage'
import WorkspacesPage from './pages/WorkspacesPage'
import CategoryPreviewPage from './pages/CategoryPreviewPage'
import ResourcesPage from './pages/ResourcesPage'
import PricingPage from './pages/PricingPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import KnowledgeHomePage from './pages/knowledge/KnowledgeHomePage'
import KnowledgeCategoryPage from './pages/knowledge/KnowledgeCategoryPage'
import KnowledgeArticlePage from './pages/knowledge/KnowledgeArticlePage'
import KnowledgeSearchPage from './pages/knowledge/KnowledgeSearchPage'
import NotFoundPage from './pages/NotFoundPage'
import PlatformLayout from './components/platform/PlatformLayout'
import DashboardPage from './pages/platform/DashboardPage'
import MyBusinessSystemsPage from './pages/platform/MyBusinessSystemsPage'
import AcademyPage from './pages/platform/AcademyPage'
import CommunityPage from './pages/platform/CommunityPage'
import MarketplacePage from './pages/platform/MarketplacePage'
import FindPage from './pages/platform/FindPage'
import PlatformResourcesPage from './pages/platform/PlatformResourcesPage'
import ProfilePage from './pages/platform/ProfilePage'
import MembershipPage from './pages/platform/MembershipPage'
import SettingsPage from './pages/platform/SettingsPage'
import SupportPage from './pages/platform/SupportPage'
import MyDocumentsPage from './pages/platform/MyDocumentsPage'
import AdminMembersPage from './pages/platform/admin/AdminMembersPage'
import AdminMemberPage from './pages/platform/admin/AdminMemberPage'
import AdminRoute from './modules/identity/routing/AdminRoute'
// Lazy: the Workspace viewer carries the full icon set and the PDF engine,
// so it loads only when a member actually opens a Workspace.
const WorkspaceViewerPage = lazy(() => import('./pages/platform/WorkspaceViewerPage'))
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ProtectedRoute from './modules/identity/routing/ProtectedRoute'
import GuestRoute from './modules/identity/routing/GuestRoute'
import StudioLayout from './studio/StudioLayout'
import ProductEnginePage from './studio/pages/ProductEnginePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/systems" element={<BrowseSystems />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        {/* Requires a signed-in member (see CommerceEngineClient.ts —
            Checkout needs a memberId to create an Order) — a guest is
            redirected to /login, matching /platform/*'s existing gate. */}
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>} />
        {/* Cleanup Step 1 (Architecture Compliance Review): retired the
            legacy ownership page — it read data/memberMock.ts's
            PURCHASED_SLUGS directly, a second, ungated ownership source
            alongside AccessService. /platform/my-systems is the single,
            correct source now (via useOwnedProducts -> AccessService); this
            redirect keeps the old URL alive rather than 404ing it, and
            ProtectedRoute naturally bounces a guest to /login first. See
            pages/MySystems.tsx and data/systems.ts's getOwnedSystems, both
            now unreferenced and left in place per the no-silent-deletion
            policy. */}
        <Route path="/my-systems" element={<Navigate to="/platform/my-systems" replace />} />
        <Route path="/system/:slug" element={<SystemOverviewPage />} />
        <Route path="/system/:slug/module/:moduleSlug" element={<SystemModulePage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/preview/:category" element={<CategoryPreviewPage />} />
        <Route path="/resources" element={<ResourcesPage />} />

        {/* BGrowth Knowledge™ Foundation — the free-content hub, ready to
            receive future BGrowth Studio-published Knowledge Packages (see
            modules/knowledge/). Mock data only today; no Studio connection,
            no API, no backend. */}
        <Route path="/knowledge" element={<KnowledgeHomePage />} />
        <Route path="/knowledge/category/:slug" element={<KnowledgeCategoryPage />} />
        <Route path="/knowledge/article/:slug" element={<KnowledgeArticlePage />} />
        <Route path="/knowledge/search" element={<KnowledgeSearchPage />} />

        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* Plans live on /pricing (BGrowth Club was retired as a name,
            27/09/2026); /club stays reachable for old links. */}
        <Route path="/club" element={<Navigate to="/pricing" replace />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* BGrowth Identity™ — Supabase Auth, shared with the Portal (see
            modules/identity/supabase/). Guest-only: an already-authenticated
            member is redirected into Workspace instead of seeing these
            forms again. */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        {/* Not guest-only: the reset email's link arrives signed in with a
            recovery session (see ResetPasswordPage). */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Not guest-only: shown to a guest right after Register, and to the
            same member once the email's link signs them in verified. */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {/* Long-standing linked-but-unrouted gap (see CLAUDE.md) — now
            resolves into the Workspace Account Area that already exists. */}
        <Route path="/account" element={<Navigate to="/platform/profile" replace />} />
        {/* Short address for the Admin area (inside the Workspace shell). */}
        <Route path="/admin" element={<Navigate to="/platform/admin" replace />} />

        {/* Catch-all — must stay last. Matches any URL nothing else in this
            file matches (including a stray /platform/* or /studio/* path
            that isn't one of their own registered children), so nothing
            ever renders a blank page. Found during the RC1 review — see
            docs/development/rc1-review-checklist.md. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* BGrowth Platform Shell — the permanent foundation every future
          authenticated product (Club, App, Academy, Find, Marketplace, AI)
          shares. Deliberately a separate layout from AppLayout above.
          Gated behind BGrowth Identity™'s mock session — see
          modules/identity/routing/ProtectedRoute.tsx. */}
      <Route
        path="/platform"
        element={
          <ProtectedRoute>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/platform/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-systems" element={<MyBusinessSystemsPage />} />
        <Route path="documents" element={<MyDocumentsPage />} />
        {/* A Studio-published Workspace, opened and filled in (Portal data). */}
        <Route
          path="workspace/:slug"
          element={
            <Suspense fallback={null}>
              <WorkspaceViewerPage />
            </Suspense>
          }
        />
        <Route path="academy" element={<AcademyPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="find" element={<FindPage />} />
        <Route path="resources" element={<PlatformResourcesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="membership" element={<MembershipPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="support" element={<SupportPage />} />
        {/* Admin — BGrowth administrators only (portal.website_admins),
            re-checked by api/admin.ts on every request. */}
        <Route path="admin" element={<AdminRoute><Navigate to="/platform/admin/members" replace /></AdminRoute>} />
        <Route path="admin/members" element={<AdminRoute><AdminMembersPage /></AdminRoute>} />
        <Route path="admin/members/:id" element={<AdminRoute><AdminMemberPage /></AdminRoute>} />
      </Route>

      {/* BGrowth Studio — a deliberate, explicit third layout. This is the
          Product Engine: an internal Product Management tool (not a
          Product Builder — see src/studio/pages/ProductEnginePage.tsx),
          separate from both the public marketing site (AppLayout) and the
          member Workspace (PlatformLayout). No BGrowth Identity™ session
          gate yet — this is a known gap, not an oversight, until real
          staff/admin auth exists. */}
      <Route path="/studio" element={<StudioLayout />}>
        <Route index element={<Navigate to="/studio/products" replace />} />
        <Route path="products" element={<ProductEnginePage />} />
      </Route>
    </Routes>
  )
}
