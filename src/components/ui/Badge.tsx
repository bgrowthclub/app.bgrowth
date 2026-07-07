import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  variant?: 'soft' | 'solid' | 'outline'
  icon?: ReactNode
  className?: string
}

const variantClass = {
  soft: 'bg-bg-soft text-primary',
  solid: 'bg-grad-primary text-white shadow-softer',
  outline: 'border border-primary/15 text-primary',
}

export default function Badge({ children, variant = 'soft', icon, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold ${variantClass[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}
