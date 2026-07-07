import { Users } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import FeatureGrid from '../ui/FeatureGrid'
import type { BusinessSystem } from '../../types/system'

export default function BusinessSystemOverview({ system }: { system: BusinessSystem }) {
  return (
    <div className="space-y-14">
      <p className="max-w-2xl text-[15px] leading-relaxed text-navy/60">{system.description}</p>

      <div>
        <SectionHeader eyebrow="Benefits" title="What it helps you do" className="mb-8" />
        <FeatureGrid features={system.benefits} />
      </div>

      <div>
        <SectionHeader eyebrow="Who Is This For" title="Built for people like you" className="mb-8" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {system.whoIsFor.map((a) => (
            <div key={a} className="flex items-center gap-3 rounded-xl border border-navy/[0.06] bg-white px-4 py-3.5 shadow-softer">
              <Users size={16} className="shrink-0 text-primary" />
              <span className="text-[14px] text-navy/70">{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
