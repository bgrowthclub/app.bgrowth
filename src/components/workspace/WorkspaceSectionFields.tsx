import type { SectionConfig, WorkspaceData } from '../../modules/workspace/types/content'
import WorkspaceFieldRenderer from './WorkspaceFieldRenderer'
import { INPUT } from './styles'

interface Props {
  section: SectionConfig
  data: WorkspaceData
  onSectionValueChange: (sectionId: string, value: WorkspaceData[string]) => void
}

// The fill-in body of one section — form fields, a checklist, outcomes, or
// free notes.
export default function WorkspaceSectionFields({ section, data, onSectionValueChange }: Props) {
  if (section.type === 'form') {
    const values = (data[section.id] as Record<string, string>) ?? {}
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {section.fields.map((field) => (
          <WorkspaceFieldRenderer
            key={field.id}
            field={field}
            value={values[field.id] ?? ''}
            onChange={(value) => onSectionValueChange(section.id, { ...values, [field.id]: value })}
          />
        ))}
      </div>
    )
  }

  if (section.type === 'checklist' || section.type === 'outcome') {
    const values = (data[section.id] as Record<string, boolean>) ?? {}
    return (
      <div className={section.type === 'outcome' ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-col gap-3'}>
        {section.items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy/10 px-4 py-3 transition-colors hover:border-workspace-300"
          >
            <input
              type="checkbox"
              checked={Boolean(values[item.id])}
              onChange={(e) => onSectionValueChange(section.id, { ...values, [item.id]: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 rounded accent-workspace-500"
            />
            <span className="text-sm text-navy/75">{item.label}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <textarea
      value={(data[section.id] as string) ?? ''}
      onChange={(e) => onSectionValueChange(section.id, e.target.value)}
      placeholder="Add any notes…"
      rows={6}
      className={INPUT}
    />
  )
}
