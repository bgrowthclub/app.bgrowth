import { Link } from 'react-router-dom'
import { ArrowUpRight, BarChart2 } from 'lucide-react'
import { ICONS_BY_CATEGORY } from './categoryIcons'
import ModuleBadge from './ModuleBadge'
import type { BusinessSystem } from '../../types/system'

interface Props {
  system: BusinessSystem
  variant?: 'grid' | 'horizontal'
  ctaLabel?: string
  ctaTo?: string
}

function uniqueModuleTypes(system: BusinessSystem) {
  return Array.from(new Set(system.components.map((c) => c.type)))
}

export default function BusinessSystemCard({ system, variant = 'grid', ctaLabel = 'View System', ctaTo }: Props) {
  const Icon = ICONS_BY_CATEGORY[system.category] ?? ICONS_BY_CATEGORY.Default
  const moduleTypes = uniqueModuleTypes(system)
  const linkTo = ctaTo ?? `/product/${system.slug}`

  if (variant === 'horizontal') {
    return (
      <Link
        to={linkTo}
        className="group flex flex-col gap-6 rounded-xl3 border border-navy/[0.06] bg-white p-7 shadow-softer transition-all duration-300 hover:border-primary/15 hover:shadow-glow sm:flex-row sm:items-center"
      >
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
          <Icon size={26} strokeWidth={2} />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
              {system.type}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-navy/35">
              <BarChart2 size={11} />
              {system.difficulty}
            </span>
          </div>
          <h3 className="mt-3 font-display text-[19px] font-bold text-navy">{system.name}</h3>
          <p className="mt-1.5 max-w-lg text-[14px] leading-relaxed text-navy/50">{system.shortDescription}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {moduleTypes.map((t) => (
              <ModuleBadge key={t} type={t} />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-3">
          <span className="font-display text-lg font-bold text-navy">${system.price}</span>
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-grad-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-softer transition-transform duration-300 group-hover:-translate-y-0.5">
            Start
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={linkTo}
      className="group flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
          <Icon size={21} strokeWidth={2} />
        </div>
        <span className="rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
          {system.type}
        </span>
      </div>

      <h3 className="mt-5 font-display text-[17px] font-bold leading-snug text-navy">{system.name}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-navy/50">{system.shortDescription}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {moduleTypes.slice(0, 3).map((t) => (
          <ModuleBadge key={t} type={t} />
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4 text-[12px] text-navy/40">
        <span>{system.category}</span>
        <span className="h-1 w-1 rounded-full bg-navy/20" />
        <span>{system.difficulty}</span>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="font-display text-[15px] font-bold text-navy">${system.price}</span>
        <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary">
          {ctaLabel}
          <ArrowUpRight
            size={15}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  )
}
