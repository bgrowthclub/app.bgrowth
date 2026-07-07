import { Link } from 'react-router-dom'
import type { BusinessSystem } from '../../types/system'

interface Props {
  system: BusinessSystem
  activeModuleId: string
}

export default function RuntimeNavigation({ system, activeModuleId }: Props) {
  if (system.modules.length <= 1) return null

  return (
    <div className="flex flex-wrap gap-2">
      {system.modules.map((m) => (
        <Link
          key={m.id}
          to={`/system/${system.slug}/module/${m.id}`}
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
            m.id === activeModuleId
              ? 'bg-grad-primary text-white shadow-softer'
              : 'border border-navy/10 bg-white text-navy/55 hover:border-primary/20'
          }`}
        >
          {m.title}
        </Link>
      ))}
    </div>
  )
}
