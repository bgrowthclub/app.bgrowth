import { ReactNode } from 'react'
import { ArrowDownUp } from 'lucide-react'
import SearchBar from './SearchBar'

interface SortOption {
  label: string
  value: string
}

interface Props {
  query: string
  onQueryChange: (value: string) => void
  sortValue: string
  onSortChange: (value: string) => void
  sortOptions: SortOption[]
  children?: ReactNode // filter pill rows
  // Passed straight through to SearchBar — omit to keep its default
  // ("Search Business Systems…"), used as-is by the public catalog
  // (BrowseSystems.tsx).
  placeholder?: string
}

export default function SearchToolbar({
  query,
  onQueryChange,
  sortValue,
  onSortChange,
  sortOptions,
  children,
  placeholder,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={query} onChange={onQueryChange} placeholder={placeholder} className="flex-1" />
        <div className="flex items-center gap-2 rounded-2xl border border-navy/10 bg-white px-4 py-3.5 shadow-softer sm:w-auto">
          <ArrowDownUp size={15} className="text-navy/30" />
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-[13.5px] font-medium text-navy focus:outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
