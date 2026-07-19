import { ArrowUpRight, Clock } from 'lucide-react'
import type { FeaturedGuide } from '../../types/knowledge'

export default function GuideCard({ guide }: { guide: FeaturedGuide }) {
  const Icon = guide.icon
  return (
    <a
      href="#"
      className="group flex flex-col gap-6 rounded-xl3 border border-navy/[0.06] bg-white p-7 shadow-softer transition-all duration-300 hover:border-primary/15 hover:shadow-glow sm:flex-row sm:items-center"
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
        <Icon size={26} strokeWidth={2} aria-hidden="true" />
      </div>

      <div className="flex-1">
        <h3 className="font-display text-[19px] font-bold text-navy">{guide.title}</h3>
        <p className="mt-1.5 max-w-lg text-[14px] leading-relaxed text-navy/50">{guide.description}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-navy/40">
          <Clock size={12} aria-hidden="true" />
          {guide.readTime}
        </span>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-grad-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-softer transition-transform duration-300 group-hover:-translate-y-0.5">
        Read Guide
        <ArrowUpRight size={14} aria-hidden="true" />
      </span>
    </a>
  )
}
