import { ReactNode } from 'react'

interface Props {
  title: ReactNode
  subtitle: string
}

// Shared "Sign In" / "Create Account" / "Reset Password" style header used
// at the top of every Authentication System form. Renders the page's one
// <h1> — safe since only one auth page is ever mounted at a time. `title`
// accepts a ReactNode rather than a plain string so a page can style part
// of it (e.g. one word in the accent color) without a second component.
export default function AuthHeader({ title, subtitle }: Props) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[26px] font-bold leading-[1.2] tracking-tight text-navy sm:text-[30px]">{title}</h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-navy/55">{subtitle}</p>
    </div>
  )
}
