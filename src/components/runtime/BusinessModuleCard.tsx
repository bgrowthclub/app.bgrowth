import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import ModuleBadge from '../systems/ModuleBadge'
import type { BusinessModule } from '../../types/system'

interface Props {
  module: BusinessModule
  to?: string // present → actionable ("Open Module →"); absent → informational preview
}

export default function BusinessModuleCard({ module, to }: Props) {
  const content = (
    <>
      <ModuleBadge type={module.type} />
      <h3 className="mt-4 font-display text-[16px] font-bold text-navy">{module.title}</h3>
      {module.description && (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{module.description}</p>
      )}
      {module.estimatedTime && (
        <div className="mt-4 flex items-center gap-1.5 text-[12px] text-navy/40">
          <Clock size={12} />
          {module.estimatedTime}
        </div>
      )}
      {to && (
        <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary">
          Open Module
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="group flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
      >
        {content}
      </Link>
    )
  }

  return <div className="flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">{content}</div>
}
