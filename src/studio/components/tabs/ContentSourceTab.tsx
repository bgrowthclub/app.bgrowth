import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import Field from '../ui/Field'
import { selectClass } from '../ui/formStyles'
import Badge from '../../../components/ui/Badge'
import ModuleBadge from '../../../components/systems/ModuleBadge'
import { CONTENT_SOURCE_TYPES, getContentSourceProvider } from '../../lib/contentSources/registry'
import type { Product } from '../../../modules/commerce/types/product'
import type { ContentSourceType } from '../../../modules/commerce/types/contentSource'

interface Props {
  product: Product
  onChange: (patch: Partial<Product>) => void
}

// Generalizes what earlier milestones called "importing a Workspace" — the
// Product Engine now points at any registered Content Source type (see
// lib/contentSources/registry.ts). Only GrowthSystem has a real provider
// today; every other type here still renders in the picker so a future
// Planner/Calculator/Academy/Template Pack provider is a registry entry,
// never a redesign of this tab. The Product Engine still never edits the
// source content itself — it only points at an existing one (by id, via
// `source`) and snapshots a few fields from it onto the Product.
export default function ContentSourceTab({ product, onChange }: Props) {
  const [sourceType, setSourceType] = useState<ContentSourceType>(product.source?.type ?? 'GrowthSystem')

  // Re-sync the type picker when a different Product is selected in the
  // left panel — the local `sourceType` state only exists so the picker
  // has something to show before an actual source id is chosen.
  useEffect(() => {
    setSourceType(product.source?.type ?? 'GrowthSystem')
  }, [product.id])

  const provider = getContentSourceProvider(sourceType)
  const options = provider?.list() ?? []
  const selectedId = product.source?.type === sourceType ? product.source.id : ''
  const snapshot = selectedId ? provider?.load(selectedId) : undefined

  function handleTypeChange(type: ContentSourceType) {
    setSourceType(type)
    onChange({ source: undefined })
  }

  function handleSelect(id: string) {
    if (!provider) return
    if (!id) {
      onChange({ source: undefined })
      return
    }
    onChange(provider.applyToProduct(product, id))
  }

  return (
    <div className="max-w-xl space-y-6">
      <Field label="Content Source Type" hint="What kind of content this product sells.">
        <select
          className={selectClass}
          value={sourceType}
          onChange={(e) => handleTypeChange(e.target.value as ContentSourceType)}
        >
          {CONTENT_SOURCE_TYPES.map((t) => (
            <option key={t.type} value={t.type} disabled={!getContentSourceProvider(t.type)}>
              {t.label}
              {!getContentSourceProvider(t.type) ? ' (coming soon)' : ''}
            </option>
          ))}
        </select>
      </Field>

      {!provider ? (
        <div className="rounded-xl2 border border-dashed border-navy/15 bg-white p-6 text-center">
          <p className="text-[13px] text-navy/45">
            No Content Source provider exists for this type yet — it's reserved for a future Studio builder.
          </p>
        </div>
      ) : (
        <>
          <Field
            label={`Select ${provider.label}`}
            hint="Only the content ID is stored — never a URL, never a copy of its content."
          >
            <select className={selectClass} value={selectedId} onChange={(e) => handleSelect(e.target.value)}>
              <option value="">— No {provider.label} selected —</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          {snapshot ? (
            <div className="rounded-xl2 border border-navy/[0.06] bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/35">
                  Loaded from {provider.label}
                </p>
                <button
                  type="button"
                  onClick={() => handleSelect(selectedId)}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary-accent"
                >
                  <RefreshCw size={12} />
                  Reload fields
                </button>
              </div>

              {(snapshot.industry || snapshot.category || snapshot.difficulty) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {snapshot.industry && <Badge variant="soft">{snapshot.industry}</Badge>}
                  {snapshot.category && <Badge variant="outline">{snapshot.category}</Badge>}
                  {snapshot.difficulty && <Badge variant="outline">{snapshot.difficulty}</Badge>}
                </div>
              )}

              <h3 className="mt-3 font-display text-[16px] font-bold text-navy">{snapshot.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-navy/50">{snapshot.description}</p>
              {snapshot.estimatedTime && (
                <p className="mt-3 text-[12px] text-navy/40">Estimated time: {snapshot.estimatedTime}</p>
              )}

              {snapshot.modules && snapshot.modules.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/35">
                    Modules ({snapshot.modules.length})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {snapshot.modules.map((m) => (
                      <ModuleBadge key={m.id} type={m.type} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-navy/40">
                <ExternalLink size={12} />
                Edit this {provider.label} in BGrowth Studio
              </div>
              <p className="mt-1 text-[11.5px] text-navy/35">
                The Product Engine only manages the product that sells this content — content changes always happen
                in the Builder that created it, not here. (Studio isn't reachable from this app yet.)
              </p>
            </div>
          ) : (
            <div className="rounded-xl2 border border-dashed border-navy/15 bg-white p-6 text-center">
              <p className="text-[13px] text-navy/45">Select a {provider.label} above to load its details.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
