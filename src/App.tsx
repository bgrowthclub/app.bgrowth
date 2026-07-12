import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import BrowseSystems from './pages/BrowseSystems'
import ProductPage from './pages/ProductPage'
import MySystems from './pages/MySystems'
import SystemOverviewPage from './pages/SystemOverviewPage'
import SystemModulePage from './pages/SystemModulePage'
import WorkspacesPage from './pages/WorkspacesPage'
import CategoryPreviewPage from './pages/CategoryPreviewPage'
import ResourcesPage from './pages/ResourcesPage'
import PricingPage from './pages/PricingPage'
import AboutPage from './pages/AboutPage'
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
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ProtectedRoute from './modules/identity/routing/ProtectedRoute'
import GuestRoute from './modules/identity/routing/GuestRoute'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/systems" element={<BrowseSystems />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/my-systems" element={<MySystems />} />
        <Route path="/system/:slug" element={<SystemOverviewPage />} />
        <Route path="/system/:slug/module/:moduleSlug" element={<SystemModulePage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/preview/:category" element={<CategoryPreviewPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* BGrowth Identity™ — mock authentication (see
            modules/identity/mock/MockIdentityProvider.tsx). Guest-only:
            an already-authenticated member is redirected into Workspace
            instead of seeing these forms again. */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        {/* Not guest-only: reachable right after Register while already
            authenticated (see RegisterPage), so it must not bounce an
            authenticated member away. */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {/* Long-standing linked-but-unrouted gap (see CLAUDE.md) — now
            resolves into the Workspace Account Area that already exists. */}
        <Route path="/account" element={<Navigate to="/platform/profile" replace />} />
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
        <Route path="academy" element={<AcademyPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="find" element={<FindPage />} />
        <Route path="resources" element={<PlatformResourcesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="membership" element={<MembershipPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="support" element={<SupportPage />} />
      </Route>
    </Routes>
  )
}
