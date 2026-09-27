import { ArrowRight, Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  // 'lg' is used where the search bar is the page's primary interaction
  // (currently just the Hero) — every existing caller keeps the default.
  size?: 'md' | 'lg'
  // When set, renders a round arrow button inside the bar that submits the
  // surrounding <form> — a visible alternative to pressing Enter. The value
  // is its accessible label (e.g. "Search").
  submitLabel?: string
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
  submitLabel,
}: Props) {
  const hasValue = value.trim() !== ''
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
      {submitLabel && (
        <button
          type="submit"
          aria-label={submitLabel}
          className={`-my-2 -mr-3 grid h-12 w-12 shrink-0 place-items-center rounded-full text-white transition-all duration-300 ${
            hasValue ? 'bg-grad-primary shadow-glow hover:scale-105' : 'bg-navy/15'
          }`}
        >
          <ArrowRight size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
