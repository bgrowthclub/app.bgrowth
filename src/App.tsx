import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import BrowseSystems from './pages/BrowseSystems'
import ProductPage from './pages/ProductPage'
import MySystems from './pages/MySystems'
import InteractiveSystem from './pages/InteractiveSystem'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/systems" element={<BrowseSystems />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/my-systems" element={<MySystems />} />
        <Route path="/system/:slug" element={<InteractiveSystem />} />
      </Route>
    </Routes>
  )
}
