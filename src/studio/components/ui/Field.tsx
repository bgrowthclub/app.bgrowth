import type { ReactNode } from 'react'

interface Props {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}

// Label + hint wrapper around a raw input/select/textarea — see
// formStyles.ts for the control styling itself.
export default function Field({ label, hint, children, className = '' }: Props) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[12.5px] font-semibold text-navy/70">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-navy/35">{hint}</span>}
    </label>
  )
}
