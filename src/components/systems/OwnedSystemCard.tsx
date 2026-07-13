import { ArrowRight, BarChart2, Clock } from 'lucide-react'
import { ICONS_BY_CATEGORY } from './categoryIcons'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import type { BusinessSystem } from '../../types/system'

interface Props {
  system: BusinessSystem
  size?: 'default' | 'featured'
}

// A Business System the member already owns — used in the Workspace
// (Continue Building, My Business Systems), never in the pre-purchase
// catalog. Deliberately a sibling of systems/BusinessSystemCard rather than
// a new branch on it: no price, two CTAs (Open/Continue + View Details)
// instead of one — so the catalog card already used on /systems and
// /product (which must not change) stays untouched. Built from the same
// existing primitives (categoryIcons, Badge, Button) as the rest of this
// folder.
export default function OwnedSystemCard({ system, size = 'default' }: Props) {
  const Icon = ICONS_BY_CATEGORY[system.category] ?? ICONS_BY_CATEGORY.Default
  const featured = size === 'featured'

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow ${
        featured ? 'md:flex-row md:hover:-translate-y-0' : ''
      }`}
    >
      {/* Cover — icon tile stands in until Studio provides a real thumbnail */}
      <div
        className={`grid shrink-0 place-items-center bg-grad-primary text-white ${
          featured ? 'h-40 md:h-auto md:w-64' : 'h-32'
        }`}
      >
        <Icon size={featured ? 44 : 30} strokeWidth={1.7} />
      </div>

      <div className={`flex flex-1 flex-col p-6 ${featured ? 'md:p-8' : ''}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">{system.industry}</Badge>
          <Badge variant="outline">{system.category}</Badge>
        </div>

        <h3 className={`mt-3 font-display font-bold text-navy ${featured ? 'text-2xl' : 'text-[17px]'}`}>
          {system.title}
        </h3>

        <p
          className={`mt-2 text-navy/50 ${
            featured ? 'text-[15px] leading-relaxed' : 'text-[13.5px] leading-relaxed'
          }`}
        >
          {system.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-navy/40">
          <span className="inline-flex items-center gap-1.5">
            <BarChart2 size={12} />
            {system.difficulty}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} />
            {system.estimatedTime}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
          <Button to={`/system/${system.slug}`} icon={<ArrowRight size={15} />}>
            {featured ? 'Continue' : 'Open Workspace'}
          </Button>
          <Button to={`/product/${system.slug}`} variant="secondary">
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}
