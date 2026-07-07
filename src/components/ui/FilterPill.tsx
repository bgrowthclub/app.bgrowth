interface Props {
  label: string
  active: boolean
  onClick: () => void
}

export default function FilterPill({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? 'bg-grad-primary text-white shadow-softer'
          : 'border border-navy/10 bg-white text-navy/60 hover:border-primary/20'
      }`}
    >
      {label}
    </button>
  )
}
