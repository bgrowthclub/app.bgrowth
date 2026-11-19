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
  Stamp,
  Calculator,
  TrendingUp,
  Lightbulb,
  GraduationCap,
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

// The Knowledge hub's category cards (19/11/2026): Studio categories are free
// text ("Notary", "Business Finance"…), so the slugs rarely match the table
// above. The look is picked by a word in the slug, then the table, then a
// steady color from the slug itself — the same category always looks the same.
const TONES = [
  'bg-blue-50 text-blue-600',
  'bg-violet-50 text-violet-600',
  'bg-amber-50 text-amber-600',
  'bg-emerald-50 text-emerald-600',
  'bg-teal-50 text-teal-600',
  'bg-rose-50 text-rose-600',
  'bg-indigo-50 text-indigo-600',
  'bg-orange-50 text-orange-600',
]

const LOOKS: [RegExp, LucideIcon, number][] = [
  [/notar|sign/, Stamp, 2],
  [/tax/, Receipt, 4],
  [/financ|money|budget|price|pricing/, Calculator, 4],
  [/market|sale|brand/, TrendingUp, 6],
  [/clean/, Sparkles, 3],
  [/home|house|local|service/, Home, 3],
  [/idea|opportunit|start/, Lightbulb, 1],
  [/career|skill|job|work/, GraduationCap, 7],
  [/legal|law/, Scale, 6],
  [/business|management|operation/, Briefcase, 0],
]

export function knowledgeCategoryLook(slug: string): { icon: LucideIcon; tone: string } {
  const hit = LOOKS.find(([re]) => re.test(slug))
  if (hit) return { icon: hit[1], tone: TONES[hit[2]] }
  let n = 0
  for (const c of slug) n = (n * 31 + c.charCodeAt(0)) >>> 0
  return { icon: KNOWLEDGE_CATEGORY_ICONS[slug] ?? KNOWLEDGE_CATEGORY_ICONS.Default, tone: TONES[n % TONES.length] }
}
