import Field from '../ui/Field'
import { inputClass, selectClass } from '../ui/formStyles'
import type { CurrencyCode } from '../../../modules/commerce/types/pricing'
import type { Product, ProductVisibility } from '../../../modules/commerce/types/product'

interface Props {
  product: Product
  onChange: (patch: Partial<Product>) => void
}

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'BRL']
const VISIBILITIES: ProductVisibility[] = ['free', 'paid', 'coming-soon', 'private']

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

export default function PricingTab({ product, onChange }: Props) {
  return (
    <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
      <Field label="Price">
        <input
          type="number"
          min={0}
          step={0.01}
          className={inputClass}
          value={product.price}
          onChange={(e) => onChange({ price: Number(e.target.value) || 0 })}
        />
      </Field>

      <Field label="Currency">
        <select
          className={selectClass}
          value={product.currency}
          onChange={(e) => onChange({ currency: e.target.value as CurrencyCode })}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sale Price" hint="Leave blank for no sale">
        <input
          type="number"
          min={0}
          step={0.01}
          className={inputClass}
          value={product.salePrice ?? ''}
          onChange={(e) => onChange({ salePrice: numberOrUndefined(e.target.value) })}
        />
      </Field>

      <Field label="Club Discount %">
        <input
          type="number"
          min={0}
          max={100}
          className={inputClass}
          value={product.clubDiscountPercent ?? ''}
          onChange={(e) => onChange({ clubDiscountPercent: numberOrUndefined(e.target.value) })}
        />
      </Field>

      <Field label="Affiliate Commission %">
        <input
          type="number"
          min={0}
          max={100}
          className={inputClass}
          value={product.affiliateCommissionPercent ?? ''}
          onChange={(e) => onChange({ affiliateCommissionPercent: numberOrUndefined(e.target.value) })}
        />
      </Field>

      <Field label="Product Visibility">
        <select
          className={selectClass}
          value={product.visibility ?? 'paid'}
          onChange={(e) => onChange({ visibility: e.target.value as ProductVisibility })}
        >
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}
