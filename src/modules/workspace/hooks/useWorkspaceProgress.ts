import { useMemo } from 'react'
import type { SectionConfig, WorkspaceContent, WorkspaceData } from '../types/content'

export interface SectionProgress {
  id: string
  filled: number
  total: number
  isComplete: boolean
  isOptional: boolean
}

const isNonEmpty = (value: unknown) => typeof value === 'string' && value.trim().length > 0
const DISPLAY_ONLY = ['title', 'static_text', 'image', 'static_image', 'file', 'link']

function progressForSection(section: SectionConfig, data: WorkspaceData): SectionProgress {
  const isOptional = Boolean(section.optional)

  if (section.type === 'form') {
    const values = (data[section.id] as Record<string, string>) ?? {}
    const required = section.fields.filter((f) => f.required)
    const counted = section.fields.filter((f) => !DISPLAY_ONLY.includes(f.type))
    const filled = counted.filter((f) => isNonEmpty(values[f.id])).length
    const isComplete =
      required.length > 0
        ? required.every((f) => isNonEmpty(values[f.id]))
        : counted.length > 0 && filled === counted.length
    return { id: section.id, filled, total: counted.length, isComplete, isOptional }
  }

  if (section.type === 'checklist' || section.type === 'outcome') {
    const values = (data[section.id] as Record<string, boolean>) ?? {}
    const filled = section.items.filter((item) => values[item.id]).length
    const isComplete = section.type === 'outcome' ? filled > 0 : section.items.length > 0 && filled === section.items.length
    return { id: section.id, filled, total: section.items.length, isComplete, isOptional }
  }

  const filled = isNonEmpty(data[section.id]) ? 1 : 0
  return { id: section.id, filled, total: 1, isComplete: filled === 1, isOptional }
}

// Same progress rules as the Portal's viewer, so a member sees the same
// percentage on both.
export function computeWorkspaceProgress(content: WorkspaceContent, data: WorkspaceData) {
  const sections: Record<string, SectionProgress> = {}
  for (const section of content.sections) sections[section.id] = progressForSection(section, data)
  const countable = Object.values(sections).filter((s) => !s.isOptional)
  const total = countable.reduce((sum, s) => sum + s.total, 0)
  const done = countable.reduce((sum, s) => sum + s.filled, 0)
  return { sections, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}

export function useWorkspaceProgress(content: WorkspaceContent, data: WorkspaceData) {
  return useMemo(() => computeWorkspaceProgress(content, data), [content, data])
}
