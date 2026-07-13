import SectionHeader from '../ui/SectionHeader'
import Carousel from '../ui/Carousel'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import { getRecommendedSystems } from '../../data/systems'
import { PURCHASED_SLUGS } from '../../data/memberMock'

export default function RecommendedSection() {
  const recommended = getRecommendedSystems(PURCHASED_SLUGS)
  if (recommended.length === 0) return null

  return (
    <div>
      <SectionHeader eyebrow="Based on what you own" title="Recommended For You" className="mb-6" />
      <Carousel>
        {recommended.map((system) => (
          <div key={system.slug} className="w-72 shrink-0 snap-start sm:w-80">
            <BusinessSystemCard system={system} />
          </div>
        ))}
      </Carousel>
    </div>
  )
}
