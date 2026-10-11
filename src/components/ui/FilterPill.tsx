import type { ReactNode } from 'react'

interface Props {
  label: string
  active: boolean
  onClick: () => void
  // Optional icon before the label.
  icon?: ReactNode
}

export default function FilterPill({ label, active, onClick, icon }: Props) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? 'bg-grad-primary text-white shadow-softer'
          : 'border border-navy/10 bg-white text-navy/60 hover:border-primary/20'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
