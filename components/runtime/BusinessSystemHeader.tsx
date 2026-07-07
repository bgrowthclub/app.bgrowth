import Badge from '../ui/Badge'
import type { BusinessSystem } from '../../types/system'

export default function BusinessSystemHeader({ system }: { system: BusinessSystem }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{system.category}</Badge>
        <Badge variant="outline">{system.type}</Badge>
        <Badge variant="outline">{system.difficulty}</Badge>
      </div>
      <h1 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl">
        {system.title}
      </h1>
      {system.subtitle && <p className="mt-2 max-w-lg text-[16px] text-navy/50">{system.subtitle}</p>}
      <div className="mt-6 flex items-center gap-4 text-[13px] text-navy/40">
        <span>{system.modules.length} modules</span>
        <span className="h-1 w-1 rounded-full bg-navy/20" />
        <span>{system.estimatedTime}</span>
      </div>
    </div>
  )
}
