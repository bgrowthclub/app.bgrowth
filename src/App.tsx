import Navbar from './components/Navbar'
import Hero from './components/Hero'
import BusinessCategories from './components/BusinessCategories'
import FeaturedSystems from './components/FeaturedSystems'
import HowItWorks from './components/HowItWorks'
import WhyBGrowth from './components/WhyBGrowth'
import ProductPreview from './components/ProductPreview'
import Testimonials from './components/Testimonials'
import JoinClub from './components/JoinClub'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg">
      <Navbar />
      <main>
        <Hero />
        <BusinessCategories />
        <FeaturedSystems />
        <HowItWorks />
        <WhyBGrowth />
        <ProductPreview />
        <Testimonials />
        <JoinClub />
      </main>
      <Footer />
    </div>
  )
}
