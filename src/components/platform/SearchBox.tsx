import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// Compact variant of ui/SearchBar's pattern (icon + controlled input), sized
// for the TopBar instead of a full-width page search block.
export default function SearchBox({ value, onChange, placeholder = 'Search…', className = '' }: Props) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-navy/10 bg-bg-soft/60 px-3.5 py-2 transition-colors focus-within:border-primary/30 focus-within:bg-white ${className}`}
    >
      <Search size={15} className="shrink-0 text-navy/30" strokeWidth={2} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13.5px] text-navy placeholder:text-navy/35 focus:outline-none"
      />
    </div>
  )
}
