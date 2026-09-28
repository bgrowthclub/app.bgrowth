import type { Ref } from 'react'
import type { WorkspaceContent, WorkspaceData } from '../../modules/workspace/types/content'
import type { SectionProgress } from '../../modules/workspace/hooks/useWorkspaceProgress'
import { getWorkspaceIcon } from '../../modules/workspace/lib/icons'
import WorkspaceSectionShell from './WorkspaceSectionShell'
import WorkspaceSectionSummaryRow from './WorkspaceSectionSummaryRow'
import type { WorkspaceStatusKind } from './WorkspaceSectionSummaryRow'
import WorkspaceSectionFields from './WorkspaceSectionFields'

interface Props {
  content: WorkspaceContent
  data: WorkspaceData
  activeId: string
  onSelect: (id: string) => void
  onContinue: (id: string) => void
  onSectionValueChange: (sectionId: string, value: WorkspaceData[string]) => void
  progressBySection: Record<string, SectionProgress>
  isContinueSaving: boolean
  continueError: string | null
  activeSectionRef?: Ref<HTMLDivElement>
}

function statusFor(progress: SectionProgress): { label: string; kind: WorkspaceStatusKind } {
  if (progress.isOptional) return { label: 'Optional', kind: 'optional' }
  if (progress.isComplete) return { label: 'Completed', kind: 'completed' }
  return { label: `${progress.filled} / ${progress.total} completed`, kind: 'progress' }
}

// One step open at a time; the rest collapse into summary rows.
export default function WorkspaceAccordion({
  content,
  data,
  activeId,
  onSelect,
  onContinue,
  onSectionValueChange,
  progressBySection,
  isContinueSaving,
  continueError,
  activeSectionRef,
}: Props) {
  const totalSteps = content.sections.length

  return (
    <div className="flex flex-col gap-4">
      {content.sections.map((section, index) => {
        const progress = progressBySection[section.id]
        const Icon = getWorkspaceIcon(section.icon)

        if (section.id === activeId) {
          return (
            <div key={section.id} ref={activeSectionRef} className="scroll-mt-24">
              <WorkspaceSectionShell
                number={section.number}
                totalSteps={totalSteps}
                icon={<Icon />}
                title={section.title}
                description={section.description}
                whyItMatters={section.whyItMatters}
                tip={section.tip}
                isLast={index === totalSteps - 1}
                onContinue={() => onContinue(section.id)}
                isSaving={isContinueSaving}
                saveError={continueError}
              >
                <WorkspaceSectionFields section={section} data={data} onSectionValueChange={onSectionValueChange} />
              </WorkspaceSectionShell>
            </div>
          )
        }

        const { label, kind } = statusFor(progress)
        return (
          <WorkspaceSectionSummaryRow
            key={section.id}
            number={section.number}
            icon={<Icon />}
            title={section.title}
            description={section.description}
            statusLabel={label}
            statusKind={kind}
            isCompleted={progress.isComplete}
            onClick={() => onSelect(section.id)}
          />
        )
      })}
    </div>
  )
}
