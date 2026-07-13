import Field from '../ui/Field'
import { inputClass, textareaClass, selectClass } from '../ui/formStyles'
import { GROWTH_CATEGORIES } from '../../../types/growth'
import type { Product, ProductType, ProductDifficulty, ProductStatus } from '../../../modules/commerce/types/product'

interface Props {
  product: Product
  onChange: (patch: Partial<Product>) => void
}

const PRODUCT_TYPES: ProductType[] = [
  'GrowthSystem',
  'Course',
  'Membership',
  'MarketplaceProduct',
  'Download',
  'Template',
  'Planner',
  'Calculator',
  'AIAssistant',
  'Certification',
  'Bundle',
  'Subscription',
]

const DIFFICULTIES: ProductDifficulty[] = ['Beginner', 'Intermediate', 'Advanced']
const STATUSES: ProductStatus[] = ['draft', 'published', 'archived', 'coming-soon']

export default function GeneralTab({ product, onChange }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Product Name" className="sm:col-span-2">
        <input
          className={inputClass}
          value={product.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Start Your Notary Business™"
        />
      </Field>

      <Field label="Slug" hint="Used in the product URL — /product/:slug">
        <input
          className={inputClass}
          value={product.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
          placeholder="start-your-notary-business"
        />
      </Field>

      <Field label="Product Type">
        <select
          className={selectClass}
          value={product.type}
          onChange={(e) => onChange({ type: e.target.value as ProductType })}
        >
          {PRODUCT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Short Description" className="sm:col-span-2" hint="Shown on cards and in search">
        <textarea
          className={textareaClass}
          rows={2}
          value={product.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>

      <Field label="Long Description" className="sm:col-span-2" hint="Shown on the product page">
        <textarea
          className={textareaClass}
          rows={5}
          value={product.longDescription ?? ''}
          onChange={(e) => onChange({ longDescription: e.target.value })}
        />
      </Field>

      <Field label="Category">
        <select
          className={selectClass}
          value={product.category}
          onChange={(e) => onChange({ category: e.target.value as Product['category'] })}
        >
          {GROWTH_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Industry" hint="Auto-filled from the selected Workspace">
        <input
          className={inputClass}
          value={product.industry ?? ''}
          onChange={(e) => onChange({ industry: e.target.value })}
          placeholder="Legal"
        />
      </Field>

      <Field label="Difficulty">
        <select
          className={selectClass}
          value={product.difficulty ?? ''}
          onChange={(e) => onChange({ difficulty: (e.target.value || undefined) as ProductDifficulty | undefined })}
        >
          <option value="">—</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Language">
        <select className={selectClass} value={product.language ?? 'en'} onChange={(e) => onChange({ language: e.target.value })}>
          <option value="en">English</option>
          <option value="pt">Português</option>
          <option value="es">Español</option>
        </select>
      </Field>

      <Field label="Version">
        <input
          className={inputClass}
          value={product.version ?? ''}
          onChange={(e) => onChange({ version: e.target.value })}
          placeholder="1.0"
        />
      </Field>

      <Field label="Status">
        <select
          className={selectClass}
          value={product.status}
          onChange={(e) => onChange({ status: e.target.value as ProductStatus })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}
