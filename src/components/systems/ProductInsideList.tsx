import type { WorkspaceOutlineSection } from '../../modules/workspace/types/portal'

// "What's inside" in the product page's tab (19/11/2026, the owner's choice:
// the cards were too long) — a compact numbered list, titles only: no
// section description, no Form/Checklist label. A Workspace or calculator
// lists its steps; a Download its files. Sibling of StudioWorkspaceOutline,
// which keeps the full cards elsewhere.
export default function ProductInsideList({ sections, items }: { sections: WorkspaceOutlineSection[]; items?: string[] }) {
  const rows = sections.length ? sections.map((s) => ({ key: s.id, title: s.title, optional: Boolean(s.optional) })) : (items ?? []).map((t, i) => ({ key: `item-${i}`, title: t, optional: false }))
  return (
    <ol className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
      {rows.map((row, i) => (
        <li key={row.key} className="flex items-baseline gap-3 border-b border-navy/[0.05] pb-2.5 text-[14px] text-navy">
          <span className="w-6 shrink-0 text-right font-display text-[13px] font-bold text-primary">{i + 1}</span>
          <span className="min-w-0">
            {row.title}
            {row.optional && <span className="ml-2 text-[11px] font-medium text-navy/40">Optional</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
