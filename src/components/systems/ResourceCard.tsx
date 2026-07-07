import { FileText, BookOpen, LayoutList, Sigma } from 'lucide-react'
import type { SystemResource } from '../../types/system'

const ICONS: Record<SystemResource['type'], typeof FileText> = {
  Template: FileText,
  Guide: BookOpen,
  Resource: LayoutList,
  Calculator: Sigma,
}

export default function ResourceCard({ resource }: { resource: SystemResource }) {
  const Icon = ICONS[resource.type]
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-softer">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bg-soft text-primary">
        <Icon size={17} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[13.5px] font-semibold text-navy">{resource.title}</p>
        <p className="text-[12px] text-navy/40">{resource.type}</p>
      </div>
    </div>
  )
}
