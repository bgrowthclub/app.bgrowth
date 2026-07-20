interface Props {
  title: string
  subtitle: string
}

// Shared "Sign In" / "Create Account" / "Reset Password" style header used
// at the top of every Authentication System form. Renders the page's one
// <h1> — safe since only one auth page is ever mounted at a time.
export default function AuthHeader({ title, subtitle }: Props) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-navy">{title}</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-navy/55">{subtitle}</p>
    </div>
  )
}
