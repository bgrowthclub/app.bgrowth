import type { SystemSection } from '../../types/system'

export type FieldValues = Record<string, string | boolean>

interface Props {
  section: SystemSection
  index: number
  values: FieldValues
  onFieldChange: (fieldId: string, value: string | boolean) => void
}

export default function SystemSectionBlock({ section, index, values, onFieldChange }: Props) {
  return (
    <div className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer md:p-8">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-lg font-bold text-navy/15">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-navy">{section.title}</h3>
          {section.description && (
            <p className="mt-1 text-[13.5px] text-navy/50">{section.description}</p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {section.fields.map((field) => {
          if (field.type === 'checkbox') {
            const checked = Boolean(values[field.id])
            return (
              <label
                key={field.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy/[0.06] bg-bg-soft/60 px-4 py-3.5 transition-colors hover:bg-bg-soft print:border-0 print:bg-transparent print:px-0"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onFieldChange(field.id, e.target.checked)}
                  className="h-4 w-4 rounded border-navy/20 text-primary focus:ring-primary/30"
                />
                <span className={`text-[14px] ${checked ? 'text-navy/40 line-through' : 'text-navy/80'}`}>
                  {field.label}
                </span>
              </label>
            )
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.id}>
                <label className="mb-1.5 block text-[13px] font-medium text-navy/60">{field.label}</label>
                <textarea
                  value={(values[field.id] as string) ?? ''}
                  onChange={(e) => onFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30 print:border-navy/20"
                />
              </div>
            )
          }

          return (
            <div key={field.id}>
              <label className="mb-1.5 block text-[13px] font-medium text-navy/60">{field.label}</label>
              <input
                type={field.type === 'date' ? 'date' : 'text'}
                value={(values[field.id] as string) ?? ''}
                onChange={(e) => onFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30 print:border-navy/20"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
