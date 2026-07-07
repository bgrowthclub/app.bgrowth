import { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  cols?: 2 | 3 | 4
  gap?: 'sm' | 'md'
}

const colsClass: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

const gapClass = { sm: 'gap-4', md: 'gap-5' }

/**
 * Standardized responsive card grid. Replaces the repeated
 * `grid gap-5 sm:grid-cols-2 lg:grid-cols-3` className strings across
 * FeaturedSystems, BrowseSystems, MySystems, etc.
 */
export default function Grid({ children, cols = 3, gap = 'md', className = '', ...rest }: Props) {
  return (
    <div className={`grid ${gapClass[gap]} ${colsClass[cols]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
