import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost'

interface BaseProps {
  variant?: Variant
  children: ReactNode
  className?: string
  icon?: ReactNode
}

interface ButtonAsButton extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  href?: undefined
  to?: undefined
}

interface ButtonAsLink extends BaseProps {
  href: string
  to?: undefined
  external?: boolean
}

interface ButtonAsRouterLink extends BaseProps {
  to: string
  href?: undefined
  onClick?: () => void
}

type Props = ButtonAsButton | ButtonAsLink | ButtonAsRouterLink

const variantClass: Record<Variant, string> = {
  primary:
    'bg-grad-primary text-white shadow-glow hover:shadow-[0_24px_70px_-10px_rgba(16,97,236,0.32)]',
  secondary:
    'border border-navy/10 bg-white text-navy shadow-softer hover:border-primary/20',
  ghost: 'text-navy/70 hover:bg-bg-soft hover:text-navy',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none'

export default function Button(props: Props) {
  const { variant = 'primary', children, className = '', icon } = props
  const classes = `${base} ${variantClass[variant]} ${className}`

  if ('to' in props && props.to) {
    return (
      <Link to={props.to} onClick={(props as ButtonAsRouterLink).onClick} className={classes}>
        {children}
        {icon}
      </Link>
    )
  }

  if ('href' in props && props.href) {
    const { href, external } = props as ButtonAsLink
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={classes}
      >
        {children}
        {icon}
      </a>
    )
  }

  const { variant: _v, icon: _i, ...rest } = props as ButtonAsButton
  return (
    <button {...rest} className={classes}>
      {children}
      {icon}
    </button>
  )
}
