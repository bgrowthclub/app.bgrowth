import { useMemo, useState } from 'react'
import { Printer, RotateCcw, Save } from 'lucide-react'
import Button from '../ui/Button'
import CalculatorFieldInput from './CalculatorFieldInput'
import { CARD, INPUT, SMALL_BUTTON, WORKSPACE_BUTTON } from '../workspace/styles'
import { buildDefaultValues, calcCompletion, computeAll, formatResult } from '../../modules/calculator/formulaEngine'
import type { CalculatorConfig, CalculatorSavedData, CalculatorValues } from '../../modules/calculator/types'

interface Props {
  config: CalculatorConfig
  initialData?: Partial<CalculatorSavedData>
  // Present when this is a saved calculation (a record); absent on the
  // blank copy, which isn't saved.
  onSave?: (data: CalculatorSavedData) => Promise<void>
}

// Runs a calculator published from BGrowth Studio: the inputs by section,
// the results updating as the member types, quick figures, the scenario
// table and notes. Same formulas and rounding as the Studio.
export default function CalculatorRunner({ config, initialData, onSave }: Props) {
  const defaults = useMemo(() => buildDefaultValues(config), [config])
  const [values, setValues] = useState<CalculatorValues>(() => ({ ...defaults, ...(initialData?.values ?? {}) }))
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const results = computeAll(config, values)
  const completion = calcCompletion(config, values)
  const highlight = config.results.filter((r) => r.highlight)
  const others = config.results.filter((r) => !r.highlight)
  const show = (formulaId: string, type: string, prefix?: string, suffix?: string) => formatResult(results[formulaId] ?? 0, type, prefix, suffix)

  async function save() {
    if (!onSave) return
    setSaving(true)
    setError(null)
    setJustSaved(false)
    try {
      await onSave({ kind: 'calculator', values, notes })
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {config.sections.map((section) => (
          <section key={section.id} className={`${CARD} p-6`}>
            <div className="mb-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-workspace-600">Step {section.number}</p>
              <h2 className="font-display text-lg font-bold text-navy">{section.title}</h2>
              {section.description && <p className="mt-0.5 text-[13.5px] text-navy/55">{section.description}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <CalculatorFieldInput
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  onChange={(v) => setValues((current) => ({ ...current, [field.id]: v }))}
                />
              ))}
            </div>
          </section>
        ))}

        {config.scenarios && config.scenarios.rows.length > 0 && (
          <section className={`${CARD} overflow-x-auto p-6`}>
            <h2 className="font-display text-lg font-bold text-navy">{config.scenarios.title}</h2>
            {config.scenarios.description && <p className="mt-0.5 text-[13.5px] text-navy/55">{config.scenarios.description}</p>}
            <table className="mt-4 w-full min-w-[420px] text-left text-[13.5px]">
              <tbody>
                {config.scenarios.rows.map((row) => {
                  const r = computeAll(config, { ...values, ...row.fieldOverrides })
                  return (
                    <tr key={row.label} className={`border-t border-navy/[0.06] ${row.isRecommended ? 'bg-workspace-500/[0.06]' : ''}`}>
                      <td className="py-2.5 pr-3 font-semibold text-navy">
                        {row.label}
                        {row.isRecommended && <span className="ml-2 text-[11px] font-bold text-workspace-600">Recommended</span>}
                      </td>
                      {row.resultIds.map((id) => {
                        const item = config.results.find((x) => x.id === id || x.formulaId === id)
                        const formulaId = item?.formulaId ?? id
                        return (
                          <td key={id} className="py-2.5 pr-3 text-navy/70">
                            <span className="block text-[11px] text-navy/40">{item?.label ?? id}</span>
                            {formatResult(r[formulaId] ?? 0, item?.type ?? 'number', item?.prefix, item?.suffix)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )}

        {config.notesEnabled && (
          <section className={`${CARD} p-6`}>
            <label htmlFor="calc-notes" className="font-display text-lg font-bold text-navy">
              Notes
            </label>
            <textarea id="calc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={`${INPUT} mt-3`} />
          </section>
        )}

        {config.footer && <p className="text-[12.5px] text-navy/45">{config.footer}</p>}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className={`${CARD} p-6`}>
          {highlight.map((r) => (
            <div key={r.id} className="mb-4">
              <p className="text-[13px] font-semibold text-navy/55">{r.label}</p>
              <p className="font-display text-4xl font-bold text-navy">{show(r.formulaId, r.type, r.prefix, r.suffix)}</p>
              {r.description && <p className="mt-0.5 text-[12px] text-navy/45">{r.description}</p>}
            </div>
          ))}
          <dl className="space-y-2.5">
            {others.map((r) => (
              <div key={r.id} className="flex items-baseline justify-between gap-3 border-t border-navy/[0.06] pt-2.5">
                <dt className="text-[13.5px] text-navy/60">{r.label}</dt>
                <dd className="text-[15px] font-semibold text-navy">{show(r.formulaId, r.type, r.prefix, r.suffix)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <div className="flex justify-between text-[12px] text-navy/45">
              <span>Required fields</span>
              <span>{completion}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-bg-soft">
              <div className="h-full rounded-full bg-workspace-500" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        {config.quickCalcs && config.quickCalcs.length > 0 && (
          <div className={`${CARD} p-5`}>
            <p className="text-[12px] font-bold uppercase tracking-wide text-navy/40">Quick figures</p>
            <dl className="mt-3 space-y-2">
              {config.quickCalcs.map((q) => (
                <div key={q.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-navy/60">{q.label}</dt>
                  <dd className="text-[14px] font-semibold text-navy">{show(q.formulaId, q.type, q.prefix, q.suffix)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="no-print flex flex-wrap items-center gap-2">
          {onSave && (
            <Button type="button" onClick={() => void save()} disabled={saving} icon={<Save size={15} />} className={`${SMALL_BUTTON} ${WORKSPACE_BUTTON}`}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => window.print()} icon={<Printer size={15} />} className={SMALL_BUTTON}>
            Print / PDF
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setValues(defaults)
              setNotes('')
            }}
            icon={<RotateCcw size={15} />}
            className={SMALL_BUTTON}
          >
            Reset
          </Button>
          {justSaved && <span className="text-xs font-medium text-emerald-600">Saved ✓</span>}
        </div>
        {error && <p className="text-[13px] text-red-500">{error}</p>}
      </aside>
    </div>
  )
}
