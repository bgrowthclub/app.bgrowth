// The Workspace JSON that BGrowth Studio publishes (portal.products.content).
// Mirrors the Portal's src/schemas/workspaceContent.schema.ts field for
// field — that schema (validated by the Publishing Engine) is the source of
// truth; keep this in sync whenever it changes.

export type WorkspaceFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'number'
  | 'select'
  | 'textarea'
  | 'title'
  | 'static_text'
  | 'image'
  | 'static_image'
  | 'checkbox'
  | 'link'
  | 'file'

export interface WorkspaceFieldConfig {
  id: string
  label: string
  type: WorkspaceFieldType
  icon: string
  required?: boolean
  placeholder?: string
  staticImageUrl?: string
  options?: string[]
  fullWidth?: boolean
}

export interface WorkspaceChecklistItem {
  id: string
  label: string
}

interface SectionBase {
  id: string
  number: number
  title: string
  description: string
  icon: string
  optional?: boolean
  whyItMatters?: string
  tip?: string
}

export interface FormSectionConfig extends SectionBase {
  type: 'form'
  fields: WorkspaceFieldConfig[]
}

export interface ChecklistSectionConfig extends SectionBase {
  type: 'checklist'
  items: WorkspaceChecklistItem[]
}

export interface NotesSectionConfig extends SectionBase {
  type: 'notes'
}

export interface OutcomeSectionConfig extends SectionBase {
  type: 'outcome'
  items: WorkspaceChecklistItem[]
}

export type SectionConfig = FormSectionConfig | ChecklistSectionConfig | NotesSectionConfig | OutcomeSectionConfig

export interface WorkspaceContent {
  productId: string
  brand: { name: string; companyLabel: string; primaryColor: string }
  footer: { proTip: string; helpText: string; helpUrl?: string }
  sections: SectionConfig[]
}

// A member's filled-in answers, keyed by section id (form → field values,
// checklist/outcome → checked item ids, notes → text).
export type WorkspaceData = Record<string, Record<string, string> | Record<string, boolean> | string>
