import type { ContentSourceType } from '../../../modules/commerce/types/contentSource'
import type { ContentSourceProvider } from './types'
import { growthSystemSource } from './growthSystemSource'

// Every ContentSourceType the Content Source tab can render a real picker
// for. Types with no entry here still type-check on Product.source (see
// types/contentSource.ts) — they're reserved for a future Planner,
// Calculator, Academy, or Template Pack provider, and the tab shows them
// as "coming soon" until one is registered here. Adding a new provider is
// the only change a new Content Source type ever requires — never a
// redesign of the tab itself.
const PROVIDERS: Partial<Record<ContentSourceType, ContentSourceProvider>> = {
  GrowthSystem: growthSystemSource,
}

// Drives the "Content Source Type" dropdown — includes types with no
// provider yet so the option is visible (and disabled) rather than simply
// absent.
export const CONTENT_SOURCE_TYPES: { type: ContentSourceType; label: string }[] = [
  { type: 'GrowthSystem', label: 'Workspace (Growth System)' },
  { type: 'Planner', label: 'Planner' },
  { type: 'Calculator', label: 'Calculator' },
  { type: 'Course', label: 'Academy Course' },
  { type: 'TemplatePack', label: 'Template Pack' },
]

export function getContentSourceProvider(type: ContentSourceType): ContentSourceProvider | undefined {
  return PROVIDERS[type]
}
