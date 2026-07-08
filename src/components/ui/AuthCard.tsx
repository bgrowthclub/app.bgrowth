import { ReactNode } from 'react'
import Card from './Card'

interface Props {
  eyebrow: string
  title: string
  children: ReactNode
  footer?: ReactNode
}

// Shared wrapper for the five auth pages (Login, Register, Forgot
// Password, Reset Password, Verify Email) — a centered, narrow Card with
// the same eyebrow+title header each one needs. Generic layout, no
// business meaning, so it lives in ui/ alongside Card rather than being
// duplicated per page.
export default function AuthCard({ eyebrow, title, children, footer }: Props) {
  return (
    <div className="container-px mx-auto max-w-md pt-32 pb-24 md:pt-40">
      <Card padding="lg">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-navy">{title}</h1>
        <div className="mt-6">{children}</div>
      </Card>
      {footer && <div className="mt-6 text-center text-[13px] text-navy/50">{footer}</div>}
    </div>
  )
}
