import SectionHeader from '../ui/SectionHeader'
import ResourceCard from '../systems/ResourceCard'
import type { SystemResource } from '../../types/system'

export default function ResourcePanel({ resources }: { resources: SystemResource[] }) {
  if (resources.length === 0) return null
  return (
    <div>
      <SectionHeader eyebrow="Resources™" title="Templates & tools" className="mb-8" />
      <div className="grid gap-3 sm:grid-cols-2">
        {resources.map((r) => (
          <ResourceCard key={r.title} resource={r} />
        ))}
      </div>
    </div>
  )
}
