import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search Business Systems…', className = '' }: Props) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-5 py-4 shadow-softer transition-colors focus-within:border-primary/30 ${className}`}
    >
      <Search size={18} className="text-navy/30" strokeWidth={2} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[15px] text-navy placeholder:text-navy/30 focus:outline-none"
      />
    </div>
  )
}
