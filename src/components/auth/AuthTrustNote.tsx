import { Lock } from 'lucide-react'

interface Props {
  children: string
}

// Small reassurance line at the bottom of the Authentication Container.
export default function AuthTrustNote({ children }: Props) {
  return (
    <p className="mt-6 flex items-center justify-center gap-1.5 text-[11.5px] text-navy/40">
      <Lock size={12} strokeWidth={2} aria-hidden="true" />
      {children}
    </p>
  )
}
