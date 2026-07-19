import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import BrowseSystems from './pages/BrowseSystems'
import ProductPage from './pages/ProductPage'
import MySystems from './pages/MySystems'
import SystemOverviewPage from './pages/SystemOverviewPage'
import SystemModulePage from './pages/SystemModulePage'
import IndustriesPage from './pages/IndustriesPage'
import ResourcesPage from './pages/ResourcesPage'
import KnowledgePage from './pages/KnowledgePage'
import PricingPage from './pages/PricingPage'
import AboutPage from './pages/AboutPage'
import ClubPage from './pages/ClubPage'

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
        <Route path="/industries" element={<IndustriesPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/club" element={<ClubPage />} />
      </Route>
    </Routes>
  )
}
