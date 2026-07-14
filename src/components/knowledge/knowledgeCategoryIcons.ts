import {
  Briefcase,
  Sparkles,
  Scale,
  PiggyBank,
  Receipt,
  HeartPulse,
  HardHat,
  Home,
  Megaphone,
  Layers,
  type LucideIcon,
} from 'lucide-react'

// One icon per Knowledge category slug (see modules/knowledge/mock/mockCategories.ts).
// Kept separate from components/systems/categoryIcons.ts — Knowledge
// categories are a different, more granular taxonomy from BusinessSystem
// industries, even where the names overlap (e.g. "Cleaning").
export const KNOWLEDGE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  business: Briefcase,
  cleaning: Sparkles,
  legal: Scale,
  finance: PiggyBank,
  taxes: Receipt,
  healthcare: HeartPulse,
  construction: HardHat,
  'real-estate': Home,
  marketing: Megaphone,
  Default: Layers,
}
