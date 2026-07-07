import { HTMLAttributes, ReactNode } from 'react'
import PageContainer from './PageContainer'

interface Props extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  background?: 'white' | 'soft' | 'navy'
  width?: 'page' | 'narrow'
}

const bgClass = {
  white: 'bg-bg',
  soft: 'bg-bg-soft',
  navy: 'bg-grad-navy',
}

/**
 * Standard homepage/page section: vertical rhythm (section-py) + a
 * PageContainer inside + an optional background tone. Replaces the
 * `<section className="section-py ...">` pattern repeated across sections.
 */
export default function SectionContainer({
  children,
  background = 'white',
  width = 'page',
  className = '',
  ...rest
}: Props) {
  return (
    <section className={`section-py relative ${bgClass[background]} ${className}`} {...rest}>
      <PageContainer width={width}>{children}</PageContainer>
    </section>
  )
}
