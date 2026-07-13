import { X } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { productPreviewService } from '../../modules/commerce/services/ProductPreviewService'
import type { Product } from '../../modules/commerce/types/product'

interface Props {
  open: boolean
  onClose: () => void
  product: Product
}

// A stand-in for the future "Preview Website" feature (see
// modules/commerce/services/ProductPreviewService.ts) — renders the same
// ProductPreviewPayload a real preview surface would eventually consume,
// just inline in a dialog instead of on its own route. Nothing here is
// deployed or publicly reachable; it only reads the current draft, which
// is why it works even for a product that has never been published.
export default function PreviewDialog({ open, onClose, product }: Props) {
  if (!open) return null

  const { product: p, generatedAt } = productPreviewService.generatePreview(product)
  const displayPrice = p.salePrice ?? p.basePrice

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl3 border border-navy/[0.06] bg-white shadow-glow">
        <div className="flex items-center justify-between border-b border-navy/[0.06] px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/35">Preview — not published</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy/40 hover:bg-bg-soft hover:text-navy"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-40 w-full overflow-hidden bg-bg-soft">
          {p.assets.heroImage ? (
            <img src={p.assets.heroImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-navy/30">No hero image set</div>
          )}
        </div>

        <div className="p-6">
          <Badge variant="soft">{p.category}</Badge>
          <h2 className="mt-3 font-display text-xl font-bold text-navy">{p.title || 'Untitled product'}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">{p.description}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-navy">
              {p.visibility === 'free' ? 'Free' : `${p.baseCurrency} ${displayPrice.toFixed(2)}`}
            </span>
            {p.salePrice != null && p.visibility !== 'free' && (
              <span className="text-[13px] text-navy/40 line-through">
                {p.baseCurrency} {p.basePrice.toFixed(2)}
              </span>
            )}
          </div>

          {p.benefits.length > 0 && (
            <ul className="mt-5 space-y-2">
              {p.benefits.map((b, i) => (
                <li key={i} className="text-[13px] text-navy/60">
                  <span className="font-semibold text-navy">{b.title}</span> — {b.description}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-6 text-[11.5px] text-navy/35">
            Generated {new Date(generatedAt).toLocaleTimeString()}. This is a draft preview, not a live page — a
            future "Preview Website" feature renders a full page from this same payload.
          </p>
        </div>
      </div>
    </div>
  )
}
