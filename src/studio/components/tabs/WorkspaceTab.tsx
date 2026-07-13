import { ExternalLink, RefreshCw } from 'lucide-react'
import Field from '../ui/Field'
import { selectClass } from '../ui/formStyles'
import Badge from '../../../components/ui/Badge'
import { getAllSystems, getSystemBySlug } from '../../../data/systems'
import { applyWorkspaceToProductDraft } from '../../lib/workspaceImport'
import type { Product } from '../../../modules/commerce/types/product'

interface Props {
  product: Product
  onChange: (patch: Partial<Product>) => void
}

// The Product Engine never edits Workspace content — it only points at an
// existing one (by id, via source) and snapshots a few fields from it onto
// the Product. Editing the Workspace itself always redirects back to
// BGrowth Studio's own Builder, never happens here.
export default function WorkspaceTab({ product, onChange }: Props) {
  const systems = getAllSystems()
  const selectedSlug = product.source?.type === 'GrowthSystem' ? product.source.id : ''
  const selectedSystem = selectedSlug ? getSystemBySlug(selectedSlug) : undefined

  function handleSelect(slug: string) {
    if (!slug) {
      onChange({ source: undefined })
      return
    }
    const system = getSystemBySlug(slug)
    if (!system) return
    onChange(applyWorkspaceToProductDraft(product, system))
  }

  return (
    <div className="max-w-xl space-y-6">
      <Field label="Select Workspace" hint="Only the Workspace ID is stored — never a URL, never a copy of its content.">
        <select className={selectClass} value={selectedSlug} onChange={(e) => handleSelect(e.target.value)}>
          <option value="">— No Workspace selected —</option>
          {systems.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.title}
            </option>
          ))}
        </select>
      </Field>

      {selectedSystem ? (
        <div className="rounded-xl2 border border-navy/[0.06] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/35">Loaded from Workspace</p>
            <button
              type="button"
              onClick={() => onChange(applyWorkspaceToProductDraft(product, selectedSystem))}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary-accent"
            >
              <RefreshCw size={12} />
              Reload fields
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="soft">{selectedSystem.industry}</Badge>
            <Badge variant="outline">{selectedSystem.category}</Badge>
            <Badge variant="outline">{selectedSystem.difficulty}</Badge>
          </div>

          <h3 className="mt-3 font-display text-[16px] font-bold text-navy">{selectedSystem.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-navy/50">{selectedSystem.shortDescription}</p>
          <p className="mt-3 text-[12px] text-navy/40">Estimated time: {selectedSystem.estimatedTime}</p>

          <div className="mt-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-navy/40">
            <ExternalLink size={12} />
            Edit this Workspace in BGrowth Studio
          </div>
          <p className="mt-1 text-[11.5px] text-navy/35">
            The Product Engine only manages the product that sells this Workspace — content changes always happen in
            the Builder that created it, not here. (Studio isn't reachable from this app yet.)
          </p>
        </div>
      ) : (
        <div className="rounded-xl2 border border-dashed border-navy/15 bg-white p-6 text-center">
          <p className="text-[13px] text-navy/45">Select a Workspace above to load its details.</p>
        </div>
      )}
    </div>
  )
}
