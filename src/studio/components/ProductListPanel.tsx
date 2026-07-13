import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import FilterPill from '../../components/ui/FilterPill'
import type { Product, ProductStatus, ProductType } from '../../modules/commerce/types/product'

interface Props {
  products: Product[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

const STATUS_OPTIONS: ProductStatus[] = ['draft', 'published', 'archived', 'coming-soon']

const STATUS_DOT_CLASS: Record<ProductStatus, string> = {
  draft: 'bg-navy/25',
  published: 'bg-primary',
  archived: 'bg-navy/15',
  'coming-soon': 'bg-primary/50',
}

export default function ProductListPanel({ products, selectedId, onSelect, onNew }: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProductStatus | 'All'>('All')
  const [type, setType] = useState<ProductType | 'All'>('All')

  const types = useMemo(() => Array.from(new Set(products.map((p) => p.type))), [products])

  const results = products.filter((p) => {
    const matchesQuery = query.trim() === '' || p.title.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'All' || p.status === status
    const matchesType = type === 'All' || p.type === type
    return matchesQuery && matchesStatus && matchesType
  })

  return (
    <div className="flex h-full flex-col rounded-xl3 border border-navy/[0.06] bg-white shadow-softer">
      <div className="space-y-3 border-b border-navy/[0.06] p-4">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-grad-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-softer transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Plus size={15} />
          New Product
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-navy/10 bg-bg-soft px-3 py-2">
          <Search size={14} className="shrink-0 text-navy/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-transparent text-[13px] text-navy placeholder:text-navy/35 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterPill label="All Statuses" active={status === 'All'} onClick={() => setStatus('All')} />
          {STATUS_OPTIONS.map((s) => (
            <FilterPill key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
          ))}
        </div>

        {types.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <FilterPill label="All Types" active={type === 'All'} onClick={() => setType('All')} />
            {types.map((t) => (
              <FilterPill key={t} label={t} active={type === t} onClick={() => setType(t)} />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {results.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-navy/40">No products match.</p>
        ) : (
          results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                selectedId === p.id ? 'bg-bg-soft' : 'hover:bg-bg-soft'
              }`}
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[p.status]}`} />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[13.5px] font-semibold ${selectedId === p.id ? 'text-primary' : 'text-navy'}`}>
                  {p.title || 'Untitled product'}
                </span>
                <span className="block truncate text-[11.5px] text-navy/40">
                  {p.type} · {p.status}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
