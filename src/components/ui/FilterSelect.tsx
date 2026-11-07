interface Option {
  value: string
  label: string
}

interface Props {
  /** Shown above the control, and read out to a screen reader as its name. */
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}

/**
 * One filter as a dropdown (07/11/2026). Replaces the rows of FilterPill in
 * the catalog: with eight Growth Categories planned and an industry arriving
 * with every new Workspace, the pills were going to push the products off
 * the first screen. FilterPill stays — it is still the right control for a
 * short, fixed list elsewhere.
 *
 * Business-agnostic by design (CLAUDE.md §6): it knows nothing about
 * systems, industries or module types, only about a list of options.
 */
export default function FilterSelect({ label, value, options, onChange }: Props) {
  const active = value !== 'All'

  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wide text-navy/35">{label}</span>
      <span
        className={`flex items-center rounded-2xl border bg-white px-4 py-2.5 shadow-softer transition-colors ${
          active ? 'border-primary/40' : 'border-navy/10'
        }`}
      >
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-transparent text-[13.5px] focus:outline-none ${active ? 'font-semibold text-navy' : 'font-medium text-navy/70'}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}
