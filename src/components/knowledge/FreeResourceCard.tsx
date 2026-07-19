import { Download } from 'lucide-react'
import type { FreeResource } from '../../types/knowledge'
import { FREE_RESOURCE_ICONS } from '../../data/knowledge'

// "Download Free" is a real, focusable <button> with no-op behavior for
// now — there's no file to serve until a CMS/file-storage backend exists.
// Same pattern as the newsletter forms elsewhere in this app (local state
// only, no network call) until that's wired up.
export default function FreeResourceCard({ resource }: { resource: FreeResource }) {
  const Icon = FREE_RESOURCE_ICONS[resource.type]
  return (
    <div className="flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-bg-soft text-primary">
          <Icon size={21} strokeWidth={2} aria-hidden="true" />
        </div>
        <span className="rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
          {resource.type}
        </span>
      </div>
      <h3 className="mt-5 flex-1 font-display text-[15px] font-bold leading-snug text-navy">{resource.title}</h3>
      <button
        type="button"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-navy/10 bg-white px-5 py-2.5 text-[13px] font-semibold text-navy shadow-softer transition-all duration-300 hover:border-primary/20 hover:-translate-y-0.5"
      >
        <Download size={14} aria-hidden="true" />
        Download Free
      </button>
    </div>
  )
}
