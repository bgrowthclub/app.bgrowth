import { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  width?: 'page' | 'narrow'
}

/**
 * The horizontal-padding + max-width wrapper used on every page and section.
 * Replaces the repeated `container-px mx-auto max-w-7xl` (or max-w-3xl)
 * className string.
 */
export default function PageContainer({ children, width = 'page', className = '', ...rest }: Props) {
  return (
    <div
      className={`container-px mx-auto ${width === 'page' ? 'max-w-page' : 'max-w-narrow'} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
