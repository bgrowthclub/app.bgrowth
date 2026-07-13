import { ImageOff } from 'lucide-react'
import Field from '../ui/Field'
import { inputClass } from '../ui/formStyles'
import { urlsToAssets, assetsToUrls } from '../../lib/assetList'
import type { Product } from '../../../modules/commerce/types/product'
import type { ProductAssets } from '../../../modules/commerce/types/assets'

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

function urlListToLines(patch: string, onSet: (urls: string[]) => void) {
  onSet(
    patch
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

// All product media lives on `product.assets` (see types/assets.ts) —
// Thumbnail and Hero Image stay single URLs, everything else (Preview
// Images, Gallery, Videos, Downloads) is a ProductAsset list edited here
// as a plain "one URL per line" textarea, same as before this
// consolidated. No real upload pipeline exists in this static MVP — every
// field here is a URL reference, not a file picker.
export default function ImagesTab({ product, onChange }: Props) {
  const assets = product.assets

  function updateAssets(patch: Partial<ProductAssets>) {
    onChange({ assets: { ...assets, ...patch } })
  }

  return (
    <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
      <Field label="Thumbnail" hint="Shown on cards and in search results">
        <input
          className={inputClass}
          value={assets.thumbnail ?? ''}
          onChange={(e) => updateAssets({ thumbnail: e.target.value })}
          placeholder="https://…"
        />
        <ImagePreview url={assets.thumbnail} />
      </Field>

      <Field label="Hero Image" hint="Shown at the top of the product page">
        <input
          className={inputClass}
          value={assets.heroImage ?? ''}
          onChange={(e) => updateAssets({ heroImage: e.target.value })}
          placeholder="https://…"
        />
        <ImagePreview url={assets.heroImage} />
      </Field>

      <Field label="Preview Images" hint="Used in share cards / social previews — one URL per line" className="sm:col-span-2">
        <textarea
          className={`${inputClass} resize-y`}
          rows={2}
          value={assetsToUrls(assets.previewImages).join('\n')}
          onChange={(e) => urlListToLines(e.target.value, (urls) => updateAssets({ previewImages: urlsToAssets(urls) }))}
          placeholder="https://…"
        />
      </Field>

      <Field label="Gallery" hint="One URL per line" className="sm:col-span-2">
        <textarea
          className={`${inputClass} resize-y`}
          rows={3}
          value={assetsToUrls(assets.gallery).join('\n')}
          onChange={(e) => urlListToLines(e.target.value, (urls) => updateAssets({ gallery: urlsToAssets(urls) }))}
          placeholder="https://…"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {assets.gallery.map((asset) => (
            <div key={asset.id} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-navy/[0.06]">
              <img src={asset.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </Field>

      <Field label="Videos" hint="One URL per line — YouTube, Vimeo, or a direct file link" className="sm:col-span-2">
        <textarea
          className={`${inputClass} resize-y`}
          rows={2}
          value={assetsToUrls(assets.videos).join('\n')}
          onChange={(e) => urlListToLines(e.target.value, (urls) => updateAssets({ videos: urlsToAssets(urls) }))}
          placeholder="https://…"
        />
      </Field>

      <Field label="Downloads" hint="One URL per line — PDFs, worksheets, or other files included with the product" className="sm:col-span-2">
        <textarea
          className={`${inputClass} resize-y`}
          rows={2}
          value={assetsToUrls(assets.downloads).join('\n')}
          onChange={(e) => urlListToLines(e.target.value, (urls) => updateAssets({ downloads: urlsToAssets(urls) }))}
          placeholder="https://…"
        />
      </Field>
    </div>
  )
}
