import { useState } from 'react'
import { Check, X as XIcon, Eye } from 'lucide-react'
import Button from '../../../components/ui/Button'
import PreviewDialog from '../PreviewDialog'
import { getPublishValidation, isReadyToPublish } from '../../lib/publishValidation'
import type { Product } from '../../../modules/commerce/types/product'

interface Props {
  product: Product
  onPublish: () => void
}

export default function PublishingTab({ product, onPublish }: Props) {
  const checks = getPublishValidation(product)
  const ready = isReadyToPublish(product)
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="eyebrow">Version</p>
        <p className="mt-2 text-[13px] text-navy/55">
          Draft v{product.versioning.draftVersion}
          {product.versioning.publishedVersion
            ? ` · Published v${product.versioning.publishedVersion}`
            : ' · Not yet published'}
        </p>
      </div>

      <div>
        <p className="eyebrow">Validation</p>
        <ul className="mt-3 space-y-2">
          {checks.map((check) => (
            <li
              key={check.label}
              className="flex items-center gap-3 rounded-xl border border-navy/[0.06] bg-white px-4 py-3"
            >
              <div
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  check.passed ? 'bg-grad-primary text-white' : 'bg-bg-soft text-navy/30'
                }`}
              >
                {check.passed ? <Check size={13} /> : <XIcon size={13} />}
              </div>
              <span className={`text-[13.5px] ${check.passed ? 'text-navy' : 'text-navy/50'}`}>{check.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => setPreviewOpen(true)}
          variant="secondary"
          icon={<Eye size={14} />}
          className="flex-1"
        >
          Preview Website
        </Button>
        <Button type="button" onClick={onPublish} disabled={!ready} className="flex-1">
          Publish Product
        </Button>
      </div>
      {!ready && <p className="text-center text-[12px] text-navy/40">Complete every check above to publish.</p>}

      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} product={product} />
    </div>
  )
}
