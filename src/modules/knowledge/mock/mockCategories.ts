import type { KnowledgeCategory } from '../types/category'

// "Browse by Category" on the Knowledge Home. The section's tenth tile,
// "More," is a static "view all categories" link to /knowledge/search —
// not a data-backed KnowledgeCategory — so it isn't listed here.
export const MOCK_CATEGORIES: KnowledgeCategory[] = [
  { id: 'cat-business', slug: 'business', name: 'Business', description: 'Starting and running a service business.' },
  { id: 'cat-cleaning', slug: 'cleaning', name: 'Cleaning', description: 'Cleaning and janitorial businesses.' },
  { id: 'cat-legal', slug: 'legal', name: 'Legal', description: 'Entity structure, contracts, and compliance.' },
  { id: 'cat-finance', slug: 'finance', name: 'Finance', description: 'Bookkeeping, budgeting, and cash flow.' },
  { id: 'cat-taxes', slug: 'taxes', name: 'Taxes', description: 'Estimated taxes, deductions, and filing.' },
  { id: 'cat-healthcare', slug: 'healthcare', name: 'Healthcare', description: 'Running a compliant healthcare practice.' },
  { id: 'cat-construction', slug: 'construction', name: 'Construction', description: 'Contracting, inspections, and permits.' },
  { id: 'cat-real-estate', slug: 'real-estate', name: 'Real Estate', description: 'Agents, showings, and property services.' },
  { id: 'cat-marketing', slug: 'marketing', name: 'Marketing', description: 'Getting and keeping customers.' },
]
