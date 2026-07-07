import {
  Scale,
  Sparkles as SparklesIcon,
  Home,
  Landmark,
  Building2,
  Truck,
  HeartHandshake,
  HardHat,
} from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import IndustryCard from '../systems/IndustryCard'

// Marketing taxonomy for the homepage — broader than the strict catalog
// `category` filter, since the platform will grow into far more industries
// than exist in the current mock catalog. Legal links to /systems?category=Notary
// since that's the closest match in the data today; the rest link to the
// unfiltered catalog until systems for them exist.
const INDUSTRIES = [
  { icon: Scale, name: 'Legal', desc: 'Notary, paralegal & filing systems', category: 'Notary' },
  { icon: SparklesIcon, name: 'Cleaning', desc: 'Crews, jobs & routes', category: 'Cleaning' },
  { icon: Home, name: 'Home Services', desc: 'Handyman, landscaping & repair', category: undefined },
  { icon: Landmark, name: 'Financial', desc: 'Bookkeeping & tax operations', category: 'Bookkeeping' },
  { icon: Building2, name: 'Real Estate', desc: 'Listings, leads & closings', category: undefined },
  { icon: Truck, name: 'Transportation', desc: 'Delivery, dispatch & routes', category: 'Delivery' },
  { icon: HeartHandshake, name: 'Personal Services', desc: 'Coaching, training & wellness', category: undefined },
  { icon: HardHat, name: 'Construction', desc: 'Bids, crews & project flow', category: undefined },
]

export default function Industries() {
  return (
    <section id="industries" className="section-py relative">
      <div className="container-px mx-auto max-w-page">
        <SectionHeader eyebrow="Industries" title="Built for the businesses people actually run." className="mb-10" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((industry, i) => (
            <IndustryCard
              key={industry.name}
              icon={industry.icon}
              name={industry.name}
              description={industry.desc}
              to={industry.category ? `/systems?category=${encodeURIComponent(industry.category)}` : '/systems'}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
