import { Check } from 'lucide-react'
import type { SectionConfig } from '../../modules/workspace/types/content'
import type { SectionProgress } from '../../modules/workspace/hooks/useWorkspaceProgress'

interface Props {
  sections: SectionConfig[]
  progress: Record<string, SectionProgress>
  activeId: string
  onSelect: (id: string) => void
}

// Every step of a Workspace, one row each (21/11/2026, the owner's design):
// number, or ✓ once complete (the same rule as the percentage); the open step
// highlighted; "Optional" under the ones Studio marked optional. Any step can
// be opened from here — nothing is locked.
export default function WorkspaceStepList({ sections, progress, activeId, onSelect }: Props) {
  return (
    <ol className="space-y-0.5">
      {sections.map((section, i) => {
        const p = progress[section.id]
        const active = section.id === activeId
        const done = Boolean(p?.isComplete)
        return (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => onSelect(section.id)}
              aria-current={active ? 'step' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                active ? 'bg-workspace-50' : 'hover:bg-bg-soft'
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11.5px] font-bold ${
                  done
                    ? 'bg-workspace-500 text-white'
                    : active
                      ? 'bg-workspace-500 text-white ring-4 ring-workspace-500/15'
                      : 'border border-navy/15 text-navy/50'
                }`}
              >
                {done && !active ? <Check size={13} strokeWidth={3} aria-label="Completed" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[12.5px] font-semibold uppercase leading-snug tracking-wide ${
                    active ? 'text-workspace-600' : 'text-navy/75'
                  }`}
                >
                  {section.title}
                </span>
                {section.optional && <span className="block text-[11px] font-medium normal-case text-navy/40">Optional</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
