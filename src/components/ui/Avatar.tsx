import { UserCircle } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = { sm: 'h-8 w-8', md: 'h-11 w-11', lg: 'h-14 w-14' }
const iconSize = { sm: 18, md: 22, lg: 28 }

// Generic placeholder avatar — there is no real profile photo yet (no
// auth/session). Swap the icon for an <img> here once real photos exist;
// every consumer (UserMenu, WorkspaceHero) stays the same.
export default function Avatar({ size = 'md', className = '' }: Props) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-grad-primary text-white ${sizeClass[size]} ${className}`}
    >
      <UserCircle size={iconSize[size]} strokeWidth={2} />
    </span>
  )
}
