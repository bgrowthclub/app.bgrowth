// Preview content for Life Worlds that don't have a live catalog yet (see
// components/sections/LifeWorlds.tsx). Sourced from PRODUCT_CATALOG.md's
// already-approved category purposes and example Growth System™ names —
// never invented copy, and never a fake/clickable system. Business &
// Entrepreneurship isn't here because it has a real catalog and links
// straight to /systems instead of a preview page.
export interface CategoryPreview {
  slug: string
  name: string
  purpose: string
  exampleSystems: string[]
}

export const CATEGORY_PREVIEWS: CategoryPreview[] = [
  {
    slug: 'career',
    name: 'Career',
    purpose: 'Help people qualify for jobs, build careers, and grow professionally.',
    exampleSystems: ['Resume Builder™', 'Interview Success™', 'Leadership™', 'Communication™'],
  },
  {
    slug: 'finance',
    name: 'Finance',
    purpose: 'Help people organize, protect, and grow their finances.',
    exampleSystems: ['Budget Planner™', 'Debt-Free System™', 'Emergency Fund™', 'Credit Builder™'],
  },
  {
    slug: 'health',
    name: 'Health',
    purpose: 'Support healthy habits and long-term wellbeing.',
    exampleSystems: ['Weight Loss Journey™', 'Meal Planning™', 'Fitness Planner™', 'Healthy Habits™'],
  },
  {
    // Homepage-only folding of Languages + Productivity + Education into one
    // "Learning" World — same simplification already noted in LifeWorlds.tsx.
    slug: 'learning',
    name: 'Learning',
    purpose: 'Help people pick up the skills, languages, and habits that open doors.',
    exampleSystems: ['English Conversation™', 'Study Planner™', 'Goal Achievement™', 'Habit Builder™'],
  },
  {
    slug: 'lifestyle',
    name: 'Lifestyle',
    purpose: 'Help people organize important moments and everyday life.',
    exampleSystems: ['Home Organization™', 'Wedding Planner™', 'Family Budget™', 'Travel Planner™'],
  },
]

export function getCategoryPreview(slug: string) {
  return CATEGORY_PREVIEWS.find((c) => c.slug === slug)
}
