import {
  Compass,
  GitBranch,
  Wrench,
  LayoutList,
  FileText,
  BookOpen,
  File,
  Sigma,
  Video,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ModuleType } from '../../types/system'

// Studio can export a 'Checklist' module type, but the brand rule is that
// the word "Checklist" never appears in the customer-facing interface.
// Functionally a checklist is a lightweight planner, so it displays as
// "Planner™" here — this is the one place that mapping lives. Every other
// module type displays under its own name.
const CONFIG: Record<ModuleType, { icon: LucideIcon; label: string }> = {
  Checklist: { icon: Compass, label: 'Planner™' },
  Planner: { icon: Compass, label: 'Planner™' },
  Workflow: { icon: GitBranch, label: 'Workflow™' },
  Toolkit: { icon: Wrench, label: 'Toolkit™' },
  Resource: { icon: LayoutList, label: 'Resources™' },
  Guide: { icon: BookOpen, label: 'Guide™' },
  Document: { icon: File, label: 'Document™' },
  Calculator: { icon: Sigma, label: 'Calculator™' },
  Template: { icon: FileText, label: 'Templates™' },
  Video: { icon: Video, label: 'Video™' },
  ExternalLink: { icon: ExternalLink, label: 'Link™' },
  AIModule: { icon: Sparkles, label: 'AI Module™' },
}

// Exported so other components (filter pills, etc.) can reuse the same
// label mapping instead of re-deriving the Checklist→Planner override.
export const MODULE_TYPE_CONFIG = CONFIG

export default function ModuleBadge({ type, className = '' }: { type: ModuleType; className?: string }) {
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
