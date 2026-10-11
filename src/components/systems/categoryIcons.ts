import { Stamp, Sparkles, Calculator, Truck, Layers } from 'lucide-react'
import {
  Briefcase,
  Car,
  Home as HomeIcon,
  HeartPulse,
  GraduationCap,
  Languages,
  PiggyBank,
  Scale,
  Camera,
  Scissors,
  UtensilsCrossed,
  Wrench,
  PawPrint,
  Baby,
  Dumbbell,
  Building2,
  Globe,
  FileText,
  Megaphone,
  ShoppingBag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICONS_BY_CATEGORY: Record<string, typeof Stamp> = {
  Notary: Stamp,
  Cleaning: Sparkles,
  Bookkeeping: Calculator,
  Delivery: Truck,
  Default: Layers,
}

// ---------------------------------------------------------------------------
// The look a category can have (Admin → Catalog → Categories, Portal
// migration 0047): an icon and a color, saved as these keys. One list for
// the Admin picker and every place that shows a category. A category with
// none (or an unknown key) falls back to DEFAULT_CATEGORY_LOOK.
// ---------------------------------------------------------------------------

export const CATEGORY_ICON_CHOICES: Record<string, { label: string; icon: LucideIcon }> = {
  layers: { label: 'General', icon: Layers },
  briefcase: { label: 'Business', icon: Briefcase },
  stamp: { label: 'Notary', icon: Stamp },
  sparkles: { label: 'Cleaning', icon: Sparkles },
  calculator: { label: 'Numbers', icon: Calculator },
  truck: { label: 'Delivery', icon: Truck },
  car: { label: 'Driving', icon: Car },
  home: { label: 'Home', icon: HomeIcon },
  heart: { label: 'Health', icon: HeartPulse },
  graduation: { label: 'Learning', icon: GraduationCap },
  languages: { label: 'Languages', icon: Languages },
  piggy: { label: 'Money', icon: PiggyBank },
  scale: { label: 'Legal', icon: Scale },
  file: { label: 'Documents', icon: FileText },
  megaphone: { label: 'Marketing', icon: Megaphone },
  shop: { label: 'Selling', icon: ShoppingBag },
  camera: { label: 'Photo', icon: Camera },
  scissors: { label: 'Beauty', icon: Scissors },
  food: { label: 'Food', icon: UtensilsCrossed },
  wrench: { label: 'Repairs', icon: Wrench },
  paw: { label: 'Pets', icon: PawPrint },
  baby: { label: 'Family', icon: Baby },
  fitness: { label: 'Fitness', icon: Dumbbell },
  building: { label: 'Real estate', icon: Building2 },
  globe: { label: 'Travel & moving', icon: Globe },
}

// soft: tinted background + text (chips); dot: a solid swatch.
export const CATEGORY_COLOR_CHOICES: Record<string, { label: string; soft: string; dot: string }> = {
  blue: { label: 'Blue', soft: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  green: { label: 'Green', soft: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  teal: { label: 'Teal', soft: 'bg-teal-50 text-teal-700', dot: 'bg-teal-500' },
  amber: { label: 'Amber', soft: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  orange: { label: 'Orange', soft: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  red: { label: 'Red', soft: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  pink: { label: 'Pink', soft: 'bg-pink-50 text-pink-700', dot: 'bg-pink-500' },
  purple: { label: 'Purple', soft: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  gray: { label: 'Gray', soft: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
}

export const DEFAULT_CATEGORY_LOOK = { icon: 'layers', color: 'blue' }

export function categoryLook(look: { icon?: string | null; color?: string | null } | null | undefined) {
  const icon = CATEGORY_ICON_CHOICES[look?.icon ?? ''] ?? CATEGORY_ICON_CHOICES[DEFAULT_CATEGORY_LOOK.icon]
  const color = CATEGORY_COLOR_CHOICES[look?.color ?? ''] ?? CATEGORY_COLOR_CHOICES[DEFAULT_CATEGORY_LOOK.color]
  return { Icon: icon.icon, color }
}
