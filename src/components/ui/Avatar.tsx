import { UserCircle } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  // Optional initials (e.g. a Knowledge author's name) — renders as text
  // instead of the generic user icon. Omit for the original placeholder
  // behavior (no real profile photo yet, no auth/session).
  label?: string
}

const sizeClass = { sm: 'h-8 w-8', md: 'h-11 w-11', lg: 'h-14 w-14' }
const iconSize = { sm: 18, md: 22, lg: 28 }
const labelTextClass = { sm: 'text-[11px]', md: 'text-[13px]', lg: 'text-[16px]' }

// Generic placeholder avatar — there is no real profile photo yet (no
// auth/session). Swap the icon for an <img> here once real photos exist;
// every consumer (UserMenu, WorkspaceHero, Knowledge's author byline) stays
// the same.
export default function Avatar({ size = 'md', className = '', label }: Props) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-grad-primary text-white ${sizeClass[size]} ${className}`}
    >
      {label ? (
        <span className={`font-display font-bold ${labelTextClass[size]}`}>{label}</span>
      ) : (
        <UserCircle size={iconSize[size]} strokeWidth={2} />
      )}
    </span>
  )
}
