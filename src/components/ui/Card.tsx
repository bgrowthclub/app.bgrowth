import { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const paddingClass = { sm: 'p-5', md: 'p-6', lg: 'p-8' }

export default function Card({ children, padding = 'md', hoverable = false, className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 ${
        hoverable ? 'hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow' : ''
      } ${paddingClass[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
