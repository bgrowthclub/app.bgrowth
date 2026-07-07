import { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  action?: ReactNode
  className?: string
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className = '',
}: Props) {
  const heading = (
    <div className={align === 'center' ? 'mx-auto max-w-xl text-center' : 'max-w-xl'}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-navy/55">{description}</p>}
    </div>
  )

  if (!action) return <div className={className}>{heading}</div>

  return (
    <div className={`flex flex-wrap items-end justify-between gap-6 ${className}`}>
      {heading}
      {action}
    </div>
  )
}
