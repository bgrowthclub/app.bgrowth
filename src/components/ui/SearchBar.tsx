import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  // 'lg' is used where the search bar is the page's primary interaction
  // (currently just the Hero) — every existing caller keeps the default.
  size?: 'md' | 'lg'
}

const sizeClass = {
  md: 'gap-3 rounded-2xl px-5 py-4',
  lg: 'gap-4 rounded-[28px] px-7 py-5',
}

const iconSize = { md: 18, lg: 22 }
const inputTextClass = { md: 'text-[15px]', lg: 'text-[17px] sm:text-[18px]' }

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search Business Systems…',
  className = '',
  size = 'md',
}: Props) {
  return (
    <div
      className={`flex items-center border border-navy/10 bg-white shadow-softer transition-all duration-300 focus-within:border-primary/30 ${sizeClass[size]} ${className}`}
    >
      <Search size={iconSize[size]} className="shrink-0 text-navy/30" strokeWidth={2} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent text-navy placeholder:text-navy/30 focus:outline-none ${inputTextClass[size]}`}
      />
    </div>
  )
}
