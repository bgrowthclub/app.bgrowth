// Each Life World's colors (20/11/2026, the owner's design): a soft card
// tint, the icon's circle and color, and the dark top of its own page.
// Keyed by WORKSPACE_CATEGORIES slug; a world not listed uses `business`.
export interface LifeWorldLook {
  card: string
  circle: string
  icon: string
  band: string
}

export const LIFE_WORLD_LOOKS: Record<string, LifeWorldLook> = {
  business: { card: 'from-emerald-50/80', circle: 'bg-emerald-100/70', icon: 'text-emerald-600', band: 'from-emerald-800 to-emerald-600' },
  career: { card: 'from-blue-50/80', circle: 'bg-blue-100/70', icon: 'text-primary', band: 'from-[#0b2a8a] to-primary' },
  finance: { card: 'from-violet-50/80', circle: 'bg-violet-100/70', icon: 'text-violet-600', band: 'from-violet-900 to-violet-600' },
  health: { card: 'from-rose-50/80', circle: 'bg-rose-100/70', icon: 'text-rose-500', band: 'from-rose-800 to-rose-500' },
  learning: { card: 'from-amber-50/80', circle: 'bg-amber-100/70', icon: 'text-amber-600', band: 'from-amber-800 to-amber-500' },
  lifestyle: { card: 'from-teal-50/80', circle: 'bg-teal-100/70', icon: 'text-teal-600', band: 'from-teal-800 to-teal-500' },
}

export function lifeWorldLook(slug: string): LifeWorldLook {
  return LIFE_WORLD_LOOKS[slug] ?? LIFE_WORLD_LOOKS.business
}
