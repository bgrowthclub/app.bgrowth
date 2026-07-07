import { Check } from 'lucide-react'
import type { SystemFeature } from '../../types/system'

export default function FeatureCard({ feature }: { feature: SystemFeature }) {
  return (
    <div className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-bg-soft text-primary">
        <Check size={16} strokeWidth={2.5} />
      </div>
      <h3 className="mt-4 font-display text-[15px] font-bold text-navy">{feature.title}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{feature.description}</p>
    </div>
  )
}
