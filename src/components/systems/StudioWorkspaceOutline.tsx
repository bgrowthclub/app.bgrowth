import { CheckCircle2, ListChecks, NotebookPen, ClipboardList } from 'lucide-react'
import type { WorkspaceOutlineSection } from '../../modules/workspace/types/portal'

interface Props {
  sections: WorkspaceOutlineSection[]
}

const KIND: Record<WorkspaceOutlineSection['type'], { label: string; Icon: typeof ClipboardList }> = {
  form: { label: 'Form', Icon: ClipboardList },
  checklist: { label: 'Checklist', Icon: ListChecks },
  notes: { label: 'Notes', Icon: NotebookPen },
  outcome: { label: 'Outcomes', Icon: CheckCircle2 },
}

// "What's inside" for a Studio-published Workspace — its real steps, in
// order, from the published Workspace's public outline (titles only).
export default function StudioWorkspaceOutline({ sections }: Props) {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {sections.map((section, i) => {
        const { label, Icon } = KIND[section.type] ?? KIND.form
        return (
          <li
            key={section.id}
            className="flex items-start gap-4 rounded-xl3 border border-navy/[0.06] bg-white p-5 shadow-softer"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bg-soft font-display text-[14px] font-bold text-primary">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold text-navy">
                {section.title}
                {section.optional && <span className="ml-2 text-[11px] font-medium text-navy/40">Optional</span>}
              </p>
              {section.description && <p className="mt-1 text-[13px] leading-relaxed text-navy/50">{section.description}</p>}
              <span className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-primary/70">
                <Icon size={13} />
                {label}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
