import type { LearningPath } from '../types/learningPath'

// Placeholder BGrowth Journeys — the Knowledge Home's "Related Learning
// Paths" section reads these to show a real, typed preview of what's
// coming, without a Journeys product behind it yet (see LearningPath's own
// doc comment).
export const MOCK_LEARNING_PATHS: LearningPath[] = [
  {
    id: 'path-start-a-cleaning-business',
    slug: 'start-a-cleaning-business',
    title: 'Start a Cleaning Business',
    description: 'From first supplies to your first ten recurring clients, step by step.',
    articleSlugs: ['cleaning-business-startup-costs', 'pressure-washing-launch-video', 'pricing-your-services-planner'],
    comingSoon: true,
  },
  {
    id: 'path-become-a-mobile-notary',
    slug: 'become-a-mobile-notary',
    title: 'Become a Mobile Notary',
    description: 'Commissioning, bonding, equipment, and booking your first signings.',
    articleSlugs: ['mobile-notary-guide', 'getting-bonded-and-insured'],
    comingSoon: true,
  },
  {
    id: 'path-get-your-books-in-order',
    slug: 'get-your-books-in-order',
    title: 'Get Your Books in Order',
    description: 'A guided path from your first bank account to your first tax filing.',
    articleSlugs: ['bookkeeping-basics-guide', 'monthly-close-sheet-template', 'quarterly-tax-calculator-explainer'],
    comingSoon: true,
  },
]
