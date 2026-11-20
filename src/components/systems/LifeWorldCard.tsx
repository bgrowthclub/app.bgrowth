import { Link } from 'react-router-dom'
import { ArrowRight, Bell } from 'lucide-react'
import { lifeWorldLook } from './lifeWorldLook'
import type { WorkspaceCategory } from '../../data/workspaceCategories'

interface Props {
  world: WorkspaceCategory
  to: string
}

// One Life World on /workspaces (20/11/2026, the owner's design): a tinted
// card with the world's icon, how many products are live in it (counted,
// never written) or "Coming soon", its name and text, and Explore / Notify
// me. A sibling of IndustryCard, which the Home's section keeps.
export default function LifeWorldCard({ world, to }: Props) {
  const look = lifeWorldLook(world.slug)
  const Icon = world.icon
  const live = world.count > 0

  return (
    <Link
      to={to}
      className={`group flex h-full flex-col rounded-[24px] border border-navy/[0.07] bg-gradient-to-br ${look.card} via-white to-white p-6 shadow-softer transition-all duration-300 hover:-translate-y-1 hover:shadow-glow`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-20 w-20 place-items-center rounded-full ${look.circle} ${look.icon}`}>
          <Icon size={34} strokeWidth={1.8} aria-hidden />
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
            live ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-navy/10 bg-white text-navy/55'
          }`}
        >
          {live ? `${world.count} ${world.count === 1 ? 'product' : 'products'} live` : 'Coming soon'}
        </span>
      </div>
      <h3 className="mt-5 font-display text-[24px] font-bold text-navy">{world.name}</h3>
      <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-navy/60">{world.description}</p>
      <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-4 py-2 text-[13.5px] font-semibold text-primary transition-colors group-hover:border-primary/30">
        {live ? (
          <>
            Explore <ArrowRight size={15} aria-hidden />
          </>
        ) : (
          <>
            <Bell size={15} aria-hidden /> See what’s coming
          </>
        )}
      </span>
    </Link>
  )
}
