import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { HelpCircle } from 'lucide-react'

// Studio stores icons by kebab-case lucide name ("file-text") — resolves
// one to its component, falling back to a neutral icon. Only the viewer
// (a lazy-loaded route) imports this, so the full icon set stays out of
// the main bundle.
export function getWorkspaceIcon(name: string): LucideIcon {
  const pascalCase = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  const icons = LucideIcons as unknown as Record<string, LucideIcon>
  return icons[pascalCase] ?? HelpCircle
}
