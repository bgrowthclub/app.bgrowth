import { Link } from 'react-router-dom'
import { ArrowUpRight, BarChart2 } from 'lucide-react'
import { ICONS_BY_CATEGORY } from './categoryIcons'
import type { BusinessSystem } from '../../types/system'

interface Props {
  system: BusinessSystem
  index?: number
}

// A premium "browse" card for the homepage's Start Here carousel — distinct
// from BusinessSystemCard (used across Browse/Product/Workspace) because
// this one leads with a full illustrated cover, not an icon-in-a-corner
// layout. Siblings, not one component branching on a `variant` prop (see
// CLAUDE.md §6). No real image asset exists yet (BusinessSystem.thumbnail/
// heroImage are unset in every system), so the cover is generated entirely
// from data already on the system — category icon, type, existing blue/navy
// tokens — never a new color, never invented content.
export default function WorkspaceCoverCard({ system, index = 0 }: Props) {
  const Icon = ICONS_BY_CATEGORY[system.category] ?? ICONS_BY_CATEGORY.Default
  const coverTone = index % 2 === 0 ? 'bg-grad-primary' : 'bg-grad-navy'

  return (
    <Link
      to={`/product/${system.slug}`}
      className="group relative shrink-0 snap-start overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
    >
      {/* Cover — abstract, generated, never a real photo/screenshot. A big
          watermark icon plus one small translucent "workspace preview"
          fragment (same visual language as the Hero's Knowledge Cloud) so
          every card reads as its own product without needing real assets. */}
      <div className="relative h-40 overflow-hidden">
        <div className={`absolute inset-0 transition-transform duration-500 group-hover:scale-105 ${coverTone}`}>
          <Icon
            size={130}
            strokeWidth={1.5}
            className="pointer-events-none absolute -right-5 -top-6 text-white/10 transition-transform duration-500 group-hover:rotate-3"
          />
          <div className="pointer-events-none absolute bottom-4 left-4 w-28 rotate-[-4deg] rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-md">
            <div className="space-y-1.5">
              <div className="h-1 w-10 rounded-full bg-white/40" />
              <div className="h-6 rounded-md bg-white/20" />
              <div className="h-1 w-2/3 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">{system.type}</p>
        <h3 className="mt-2 font-display text-[18px] font-bold leading-snug text-navy line-clamp-1">
          {system.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-navy/50 line-clamp-2">{system.shortDescription}</p>

        <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
          <BarChart2 size={11} />
          {system.difficulty}
        </span>

        <div className="mt-5 flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <span className="font-display text-[17px] font-bold text-navy">${system.price}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-grad-primary px-4 py-2 text-[13px] font-semibold text-white shadow-softer transition-transform duration-300 group-hover:-translate-y-0.5">
            Start
            <ArrowUpRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  )
}
