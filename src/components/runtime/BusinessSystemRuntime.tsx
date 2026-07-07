import { Link } from 'react-router-dom'
import SectionHeader from '../ui/SectionHeader'
import BusinessSystemHeader from './BusinessSystemHeader'
import BusinessSystemOverview from './BusinessSystemOverview'
import BusinessModuleGrid from './BusinessModuleGrid'
import ResourcePanel from './ResourcePanel'
import AffiliatePanel from './AffiliatePanel'
import ReviewPanel from './ReviewPanel'
import FAQPanel from './FAQPanel'
import RelatedSystemsPanel from './RelatedSystemsPanel'
import type { BusinessSystem } from '../../types/system'

export default function BusinessSystemRuntime({ system }: { system: BusinessSystem }) {
  return (
    <div className="pt-32 pb-24 md:pt-40">
      <div className="container-px mx-auto max-w-page">
        <Link to="/systems" className="text-[13px] font-semibold text-primary">
          ← Back to Business Systems
        </Link>
        <div className="mt-6">
          <BusinessSystemHeader system={system} />
        </div>
      </div>

      <div className="container-px mx-auto mt-14 max-w-page">
        <BusinessSystemOverview system={system} />
      </div>

      <div className="container-px mx-auto mt-14 max-w-page">
        <SectionHeader eyebrow="Modules" title="Open a module" className="mb-8" />
        <BusinessModuleGrid system={system} />
      </div>

      <div className="container-px mx-auto mt-14 max-w-page">
        <ResourcePanel resources={system.resources} />
      </div>

      <div className="container-px mx-auto mt-14 max-w-page">
        <AffiliatePanel partners={system.affiliatePartners} />
      </div>

      <div className="container-px mx-auto mt-14 max-w-page">
        <ReviewPanel reviews={system.reviews} />
      </div>

      <div className="container-px mx-auto mt-14 max-w-narrow">
        <FAQPanel items={system.faq} />
      </div>

      <div className="container-px mx-auto mt-14 max-w-page">
        <RelatedSystemsPanel system={system} />
      </div>
    </div>
  )
}
