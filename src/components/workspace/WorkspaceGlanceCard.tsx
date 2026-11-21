import { CalendarCheck } from 'lucide-react'
import type { FormSectionConfig, WorkspaceContent, WorkspaceData, WorkspaceFieldType } from '../../modules/workspace/types/content'
import { CARD } from './styles'

const SHORT: WorkspaceFieldType[] = ['text', 'email', 'phone', 'date', 'time', 'number', 'select']
const MAX = 6

function show(type: WorkspaceFieldType, value: string): string {
  if (type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (type === 'time' && /^\d{2}:\d{2}$/.test(value)) {
    const [h, min] = value.split(':').map(Number)
    return new Date(2000, 0, 1, h, min).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  return value
}

// "At a glance" (21/11/2026, the owner's automatic rule — a "Show in summary"
// choice per field in Studio may come later): the answers of the Workspace's
// first section that has short fields, with Studio's own labels, up to six.
// Long texts, images and files stay out. Nothing filled = no card.
export default function WorkspaceGlanceCard({ content, data }: { content: WorkspaceContent; data: WorkspaceData }) {
  const section = content.sections.find(
    (s): s is FormSectionConfig => s.type === 'form' && s.fields.some((f) => SHORT.includes(f.type)),
  )
  if (!section) return null
  const values = (data[section.id] as Record<string, string> | undefined) ?? {}
  const rows = section.fields
    .filter((f) => SHORT.includes(f.type) && typeof values[f.id] === 'string' && values[f.id].trim())
    .slice(0, MAX)
    .map((f) => ({ id: f.id, label: f.label, value: show(f.type, values[f.id].trim()) }))
  if (rows.length === 0) return null

  return (
    <section className={`${CARD} p-5`}>
      <h2 className="flex items-center gap-2 text-[14.5px] font-bold text-navy">
        <CalendarCheck className="h-[18px] w-[18px] text-workspace-500" aria-hidden />
        At a glance
      </h2>
      <p className="mt-0.5 text-[12px] text-navy/45">From “{section.title}”</p>
      <dl className="mt-4 grid gap-3.5 border-t border-navy/[0.06] pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
        {rows.map((r) => (
          <div key={r.id}>
            <dt className="text-[12px] text-navy/45">{r.label}</dt>
            <dd className="mt-0.5 break-words text-[14px] font-medium text-navy">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
