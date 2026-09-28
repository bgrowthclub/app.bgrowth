import type { WorkspaceFieldConfig } from '../../modules/workspace/types/content'
import { getWorkspaceIcon } from '../../modules/workspace/lib/icons'
import { INPUT } from './styles'

interface Props {
  field: WorkspaceFieldConfig
  value: string
  onChange: (value: string) => void
}

// One Studio field, rendered for filling in (ported from the Portal's
// WorkspaceFieldRenderer — same field types and behavior).
export default function WorkspaceFieldRenderer({ field, value, onChange }: Props) {
  const Icon = getWorkspaceIcon(field.icon)
  const fieldId = `field-${field.id}`

  if (field.type === 'title') {
    return (
      <div className="border-b border-navy/[0.06] pb-1 pt-4 first:pt-0 sm:col-span-2">
        <h3 className="text-base font-bold tracking-tight text-navy">{field.label}</h3>
      </div>
    )
  }

  if (field.type === 'static_text') {
    return (
      <div className="pt-1 sm:col-span-2">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy/55">{field.label}</p>
      </div>
    )
  }

  if (field.type === 'image' || field.type === 'static_image') {
    const src = field.staticImageUrl ?? field.placeholder
    return (
      <div className={field.fullWidth !== false ? 'sm:col-span-2' : undefined}>
        {src && <img src={src} alt={field.label} className="max-h-64 w-full rounded-lg border border-navy/10 object-cover" />}
        {field.label && <p className="mt-1 text-center text-xs text-navy/45">{field.label}</p>}
      </div>
    )
  }

  if (field.type === 'file') {
    return (
      <div className={field.fullWidth !== false ? 'sm:col-span-2' : undefined}>
        {field.placeholder && (
          <a
            href={field.placeholder}
            download={field.label || 'file'}
            className="inline-flex items-center gap-2 rounded-lg border border-navy/10 bg-bg-soft px-4 py-2.5 text-sm font-medium text-navy/75 hover:bg-navy/[0.06]"
          >
            <Icon className="h-4 w-4" />
            {field.label || 'Download File'}
          </a>
        )}
      </div>
    )
  }

  if (field.type === 'link') {
    const raw = field.placeholder ?? ''
    const href = raw && !/^(https?:\/\/|#)/.test(raw) ? `https://${raw}` : raw || '#'
    return (
      <div className={field.fullWidth ? 'sm:col-span-2' : undefined}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-workspace-600 hover:underline"
        >
          <Icon className="h-4 w-4" />
          {field.label || raw}
        </a>
      </div>
    )
  }

  return (
    <div className={field.fullWidth ? 'flex flex-col gap-1.5 sm:col-span-2' : 'flex flex-col gap-1.5'}>
      <label htmlFor={fieldId} className="flex items-center gap-1.5 text-sm font-medium text-navy/75">
        <Icon className="h-3.5 w-3.5 text-workspace-500" />
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>

      {field.type === 'checkbox' ? (
        <label className="flex cursor-pointer items-center gap-2">
          <input
            id={fieldId}
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(String(e.target.checked))}
            className="h-4 w-4 rounded accent-workspace-500"
          />
          <span className="text-sm text-navy/75">{field.placeholder || field.label}</span>
        </label>
      ) : field.type === 'select' ? (
        <select id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT}>
          <option value="">Select…</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={INPUT}
        />
      ) : (
        <input
          id={fieldId}
          type={field.type === 'phone' ? 'tel' : field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={INPUT}
        />
      )}
    </div>
  )
}
