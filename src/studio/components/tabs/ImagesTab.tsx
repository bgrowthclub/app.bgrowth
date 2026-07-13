import { ImageOff } from 'lucide-react'
import Field from '../ui/Field'
import { inputClass } from '../ui/formStyles'
import type { Product } from '../../../modules/commerce/types/product'

interface Props {
  product: Product
  onChange: (patch: Partial<Product>) => void
}

function ImagePreview({ url }: { url?: string }) {
  return (
    <div className="mt-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-navy/[0.06] bg-bg-soft">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <ImageOff size={20} className="text-navy/20" />
      )}
    </div>
  )
}

// No real upload pipeline exists in this static MVP — every field here is
// a URL reference (matching how the rest of the app already stands in for
// real assets), not a file picker. Wiring an actual uploader is future
// work, once there's somewhere real to store the file.
export default function ImagesTab({ product, onChange }: Props) {
  return (
    <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
      <Field label="Thumbnail" hint="Shown on cards and in search results">
        <input
          className={inputClass}
          value={product.thumbnail ?? ''}
          onChange={(e) => onChange({ thumbnail: e.target.value })}
          placeholder="https://…"
        />
        <ImagePreview url={product.thumbnail} />
      </Field>

      <Field label="Hero Image" hint="Shown at the top of the product page">
        <input
          className={inputClass}
          value={product.heroImage ?? ''}
          onChange={(e) => onChange({ heroImage: e.target.value })}
          placeholder="https://…"
        />
        <ImagePreview url={product.heroImage} />
      </Field>

      <Field label="Preview Image" hint="Used in share cards / social previews">
        <input
          className={inputClass}
          value={product.previewImage ?? ''}
          onChange={(e) => onChange({ previewImage: e.target.value })}
          placeholder="https://…"
        />
        <ImagePreview url={product.previewImage} />
      </Field>

      <Field label="Gallery" hint="One URL per line" className="sm:col-span-2">
        <textarea
          className={`${inputClass} resize-y`}
          rows={3}
          value={(product.gallery ?? []).join('\n')}
          onChange={(e) =>
            onChange({ gallery: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="https://…"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {(product.gallery ?? []).map((url) => (
            <div key={url} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-navy/[0.06]">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </Field>
    </div>
  )
}
