import type { AdminCatalogProduct, AdminCategory } from '../../modules/admin/types'
import CategorySelect from './CategorySelect'
import { pillClass } from './styles'

interface Props {
  product: AdminCatalogProduct
  categories: AdminCategory[]
  saving: boolean
  onChange: (categoryId: string | null) => void
}

// One published Workspace and its category, changed in place.
export default function AdminProductCategoryRow({ product, categories, saving, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-navy">{product.name}</p>
        <p className="truncate text-[12px] text-navy/40">
          {product.slug}
          {product.status !== 'published' && <span className={`${pillClass('gray')} ml-2`}>{product.status}</span>}
        </p>
      </div>
      <CategorySelect
        categories={categories}
        value={product.category_id}
        onChange={onChange}
        disabled={saving}
        className={`sm:!w-72 ${saving ? 'opacity-60' : ''}`}
      />
    </div>
  )
}
