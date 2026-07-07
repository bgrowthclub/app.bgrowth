import { Compass, GitBranch, Wrench, LayoutList, FileText, BookOpen } from 'lucide-react'
import type { ComponentType } from '../../types/system'

const CONFIG: Record<ComponentType, { icon: typeof Compass; label: string }> = {
  Planner: { icon: Compass, label: 'Planner™' },
  Workflow: { icon: GitBranch, label: 'Workflow™' },
  Toolkit: { icon: Wrench, label: 'Toolkit™' },
  Resource: { icon: LayoutList, label: 'Resources™' },
  Template: { icon: FileText, label: 'Templates™' },
  Guide: { icon: BookOpen, label: 'Guide™' },
}

export default function ModuleBadge({ type, className = '' }: { type: ComponentType; className?: string }) {
  const { icon: Icon, label } = CONFIG[type]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-bg-soft px-3 py-1.5 text-[11px] font-semibold text-primary ${className}`}
    >
      <Icon size={12} strokeWidth={2.3} />
      {label}
    </span>
  )
}
