import { Check, X as XIcon } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { getPublishValidation, isReadyToPublish } from '../../lib/publishValidation'
import type { Product } from '../../../modules/commerce/types/product'

interface Props {
  product: Product
  onPublish: () => void
}

export default function PublishingTab({ product, onPublish }: Props) {
  const checks = getPublishValidation(product)
  const ready = isReadyToPublish(product)

  return (
    <div className="max-w-xl space-y-6">
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

      <Button type="button" onClick={onPublish} disabled={!ready} className="w-full">
        Publish Product
      </Button>
      {!ready && <p className="text-center text-[12px] text-navy/40">Complete every check above to publish.</p>}
    </div>
  )
}
