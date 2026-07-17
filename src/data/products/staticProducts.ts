// The Website's Product Catalog — a deliberately static, hand-authored
// list of BGrowth's real, completed products, built entirely on Commerce's
// existing `Product` model (modules/commerce/types/product.ts). This is
// NOT a second Product type and NOT a second catalog architecture: it is
// the temporary data source behind ProductCatalogService
// (services/ProductCatalogService.ts), standing in for the future Product
// Engine's database. When the Product Engine ships, only the repository
// passed into createProductCatalogService changes — this file, and every
// page reading through ProductCatalogService, stay the same.
//
// Deliberately separate from Studio's own admin/draft mock
// (modules/commerce/mock/mockProducts.ts) — that file is Studio's internal
// editing playground (every ProductStatus, including drafts never meant to
// be publicly visible) read by ProductAdminService; this file is the
// Website's already-published catalog, read by ProductCatalogService. The
// two are allowed to diverge; Member Area ownership (lib/productLibrary.ts)
// still resolves against Studio's mock on purpose, since it's keyed to
// AccessService's existing mock access grants (see
// modules/commerce/mock/mockProductAccess.ts) — not a gap, a scoped
// boundary for this catalog's first pass.

import type { Product } from '../../modules/commerce/types/product'
import type { ProductSnapshot, ProductVersioning } from '../../modules/commerce/types/version'
import { createEmptyProductAssets } from '../../modules/commerce/types/assets'

function published(snapshot: ProductSnapshot, publishedAt: string): Product {
  const versioning: ProductVersioning = {
    draftVersion: 1,
    publishedVersion: 1,
    history: [{ version: 1, publishedAt, snapshot }],
  }
  return { ...snapshot, versioning }
}

const RAW: ProductSnapshot[] = [
  {
    id: 'catalog-notary-basics-workspace',
    slug: 'notary-basics-workspace',
    title: 'Notary Basics Workspace™',
    subtitle: 'Everything to go from licensed to booked.',
    description: 'A complete launch path from licensing to your first signing appointment.',
    longDescription:
      'Notary Basics Workspace™ walks a newly commissioned notary through every step of actually starting to earn — state requirements, equipment, pricing, and where to find your first clients — so nothing is left to guesswork in your first ninety days.',
    category: 'business-entrepreneurship',
    industry: 'Notary',
    price: 79,
    currency: 'USD',
    visibility: 'paid',
    type: 'GrowthSystem',
    assets: {
      ...createEmptyProductAssets(),
      downloads: [{ id: 'notary-launch-checklist', url: '#', label: 'Notary Launch Checklist (PDF)' }],
    },
    featured: true,
    status: 'published',
    benefits: [
      { title: 'Guided sequence', description: 'Every step unlocks the next, so nothing gets skipped.' },
      { title: 'Real pricing guidance', description: 'Know what to charge before your first booking.' },
    ],
    whatsIncluded: ['State commissioning checklist', 'Equipment shopping list', 'Pricing worksheet', 'Client intake template'],
    faq: [
      { question: 'Do I need to already be commissioned?', answer: 'No — the workspace starts before commissioning and walks you through it.' },
      { question: 'Is this specific to one state?', answer: 'The core workflow applies everywhere; state-specific notes are called out where requirements differ.' },
    ],
    relatedProductIds: ['catalog-loan-signing-workspace'],
    relatedKnowledgeSlugs: ['mobile-notary-guide', 'getting-bonded-and-insured'],
    seo: {
      metaTitle: 'Notary Basics Workspace™ | BGrowth',
      metaDescription: 'Launch a mobile notary business with a guided, step-by-step Workspace™.',
      keywords: ['mobile notary', 'become a notary', 'notary business'],
    },
    tags: ['notary', 'launch', 'beginner'],
    difficulty: 'Beginner',
    estimatedTime: '2–3 weeks',
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 50,
    source: { type: 'GrowthSystem', id: 'start-your-notary-business' },
  },
  {
    id: 'catalog-loan-signing-workspace',
    slug: 'loan-signing-workspace',
    title: 'Loan Signing Workspace™',
    subtitle: 'Specialize in the highest-paying notary work.',
    description: 'A focused workspace for building a loan signing agent practice on top of your notary commission.',
    longDescription:
      'Loan Signing Workspace™ covers signing agent certification, the paperwork walkthrough lenders expect, and how to get listed with the signing services that generate steady, higher-paying bookings.',
    category: 'business-entrepreneurship',
    industry: 'Notary',
    price: 99,
    currency: 'USD',
    visibility: 'paid',
    type: 'GrowthSystem',
    assets: {
      ...createEmptyProductAssets(),
      downloads: [{ id: 'signing-agent-directory-list', url: '#', label: 'Signing Agency Directory List (PDF)' }],
    },
    featured: false,
    status: 'published',
    benefits: [
      { title: 'Higher-paying work', description: 'Loan signings pay more per appointment than standard notarizations.' },
      { title: 'Directory-ready', description: 'Get listed with signing services faster with a ready checklist.' },
    ],
    whatsIncluded: ['Signing agent certification checklist', 'Loan document walkthrough', 'Signing service directory list'],
    faq: [{ question: 'Do I need Notary Basics Workspace first?', answer: 'It helps, but this workspace also works for an already-commissioned notary.' }],
    relatedProductIds: ['catalog-notary-basics-workspace'],
    relatedKnowledgeSlugs: ['mobile-notary-guide'],
    seo: {
      metaTitle: 'Loan Signing Workspace™ | BGrowth',
      metaDescription: 'Build a loan signing agent practice with a guided Workspace™.',
      keywords: ['loan signing agent', 'notary signing agent', 'mobile notary'],
    },
    tags: ['notary', 'loan-signing', 'intermediate'],
    difficulty: 'Intermediate',
    estimatedTime: '1–2 weeks',
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 60,
  },
  {
    id: 'catalog-cleaning-business-basics',
    slug: 'cleaning-business-basics',
    title: 'Cleaning Business Basics™',
    subtitle: 'From first supplies to your first ten clients.',
    description: 'A complete launch path for starting a residential cleaning business.',
    longDescription:
      'Cleaning Business Basics™ covers what to actually buy in month one, how to price your first jobs, and where to find your first recurring residential clients — without overspending before you’ve booked a single job.',
    category: 'business-entrepreneurship',
    industry: 'Cleaning',
    price: 69,
    currency: 'USD',
    visibility: 'paid',
    type: 'GrowthSystem',
    assets: {
      ...createEmptyProductAssets(),
      downloads: [{ id: 'cleaning-supply-checklist', url: '#', label: 'Starter Supply Checklist (PDF)' }],
    },
    featured: true,
    status: 'published',
    benefits: [
      { title: 'Low startup cost', description: 'Start with under $1,000 in essential supplies and insurance.' },
      { title: 'Recurring revenue', description: 'Built around landing repeat clients, not one-off jobs.' },
    ],
    whatsIncluded: ['Starter supply checklist', 'Pricing worksheet', 'Client booking template'],
    faq: [{ question: 'Do I need employees to start?', answer: 'No — this workspace is built for a solo start, with room to grow into hiring later.' }],
    relatedProductIds: ['catalog-pressure-washing-workspace'],
    relatedKnowledgeSlugs: ['cleaning-business-startup-costs', 'pricing-your-services-planner'],
    seo: {
      metaTitle: 'Cleaning Business Basics™ | BGrowth',
      metaDescription: 'Launch a residential cleaning business with a guided Workspace™.',
      keywords: ['cleaning business', 'start a cleaning business', 'residential cleaning'],
    },
    tags: ['cleaning', 'launch', 'beginner'],
    difficulty: 'Beginner',
    estimatedTime: '2–3 weeks',
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 50,
    source: { type: 'GrowthSystem', id: 'cleaning-business-launch' },
  },
  {
    id: 'catalog-pressure-washing-workspace',
    slug: 'pressure-washing-workspace',
    title: 'Pressure Washing Workspace™',
    subtitle: 'Add a high-margin outdoor service.',
    description: 'A focused workspace for launching a pressure washing service alongside or instead of interior cleaning.',
    longDescription:
      'Pressure Washing Workspace™ covers the equipment worth buying first, how to price driveways, siding, and decks, and a script for turning an estimate call into a booked job.',
    category: 'business-entrepreneurship',
    industry: 'Cleaning',
    price: 59,
    currency: 'USD',
    visibility: 'paid',
    type: 'GrowthSystem',
    assets: {
      ...createEmptyProductAssets(),
      downloads: [{ id: 'pressure-washing-pricing-sheet', url: '#', label: 'Per-Square-Foot Pricing Sheet (PDF)' }],
    },
    featured: false,
    status: 'published',
    benefits: [
      { title: 'High margin', description: 'Equipment pays for itself faster than most starter services.' },
      { title: 'Simple pricing', description: 'A per-square-foot method that works on the first estimate call.' },
    ],
    whatsIncluded: ['Equipment buying guide', 'Per-square-foot pricing sheet', 'Estimate call script'],
    faq: [{ question: 'Can I run this alongside a cleaning business?', answer: 'Yes — it’s designed to add on to Cleaning Business Basics™ or stand alone.' }],
    relatedProductIds: ['catalog-cleaning-business-basics'],
    relatedKnowledgeSlugs: ['pressure-washing-launch-video'],
    seo: {
      metaTitle: 'Pressure Washing Workspace™ | BGrowth',
      metaDescription: 'Launch a pressure washing service with a guided Workspace™.',
      keywords: ['pressure washing business', 'start a pressure washing business'],
    },
    tags: ['cleaning', 'pressure-washing', 'beginner'],
    difficulty: 'Beginner',
    estimatedTime: '1–2 weeks',
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 40,
  },
  {
    id: 'catalog-bookkeeping-basics',
    slug: 'bookkeeping-basics',
    title: 'Bookkeeping Basics™',
    subtitle: 'Keep clean books without hiring a bookkeeper.',
    description: 'A complete workspace for setting up and maintaining accurate books as a solo business owner.',
    longDescription:
      'Bookkeeping Basics™ walks through separating business and personal money, a weekly reconciliation habit, and a one-page monthly close — everything a solo owner needs to keep books that survive tax season.',
    category: 'business-entrepreneurship',
    industry: 'Bookkeeping',
    price: 89,
    currency: 'USD',
    visibility: 'paid',
    type: 'GrowthSystem',
    assets: {
      ...createEmptyProductAssets(),
      downloads: [{ id: 'monthly-close-sheet', url: '#', label: 'Monthly Close Sheet (PDF)' }],
    },
    featured: true,
    status: 'published',
    benefits: [
      { title: 'Tax-season ready', description: 'Books that hold up when it’s time to file.' },
      { title: 'Fifteen minutes a week', description: 'Built around a light weekly habit, not a year-end scramble.' },
    ],
    whatsIncluded: ['Chart of accounts starter', 'Weekly reconciliation checklist', 'Monthly close sheet'],
    faq: [{ question: 'Do I need accounting experience?', answer: 'No — every step assumes no prior bookkeeping background.' }],
    relatedProductIds: ['catalog-tax-preparation-basics'],
    relatedKnowledgeSlugs: ['bookkeeping-basics-guide', 'monthly-close-sheet-template'],
    seo: {
      metaTitle: 'Bookkeeping Basics™ | BGrowth',
      metaDescription: 'Set up and maintain clean books with a guided Workspace™.',
      keywords: ['bookkeeping for small business', 'small business bookkeeping basics'],
    },
    tags: ['bookkeeping', 'finance', 'beginner'],
    difficulty: 'Beginner',
    estimatedTime: '1–2 weeks',
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 50,
    source: { type: 'GrowthSystem', id: 'bookkeeping-operations' },
  },
  {
    id: 'catalog-tax-preparation-basics',
    slug: 'tax-preparation-basics',
    title: 'Tax Preparation Basics™',
    subtitle: 'Know what you owe before the deadline.',
    description: 'A workspace for estimating and preparing for quarterly and annual self-employment taxes.',
    longDescription:
      'Tax Preparation Basics™ walks through estimating quarterly payments, tracking deductible expenses through the year, and assembling everything a preparer needs come filing season — built for a solo owner, not an accountant.',
    category: 'business-entrepreneurship',
    industry: 'Taxes',
    price: 99,
    currency: 'USD',
    visibility: 'paid',
    type: 'GrowthSystem',
    assets: {
      ...createEmptyProductAssets(),
      downloads: [{ id: 'quarterly-tax-worksheet', url: '#', label: 'Quarterly Tax Worksheet (PDF)' }],
    },
    featured: false,
    status: 'published',
    benefits: [
      { title: 'No more guessing', description: 'A clear estimate before every quarterly deadline.' },
      { title: 'Filing-season ready', description: 'Everything organized before you ever sit down with a preparer.' },
    ],
    whatsIncluded: ['Quarterly tax worksheet', 'Deductible expense tracker', 'Filing-season document checklist'],
    faq: [{ question: 'Does this replace a tax professional?', answer: 'No — it prepares your numbers and documents so a filing goes faster and costs less.' }],
    relatedProductIds: ['catalog-bookkeeping-basics'],
    relatedKnowledgeSlugs: ['quarterly-tax-calculator-explainer', 'budgeting-for-solo-founders-video'],
    seo: {
      metaTitle: 'Tax Preparation Basics™ | BGrowth',
      metaDescription: 'Estimate and prepare for self-employment taxes with a guided Workspace™.',
      keywords: ['self employment taxes', 'quarterly estimated taxes', 'small business tax prep'],
    },
    tags: ['taxes', 'finance', 'beginner'],
    difficulty: 'Beginner',
    estimatedTime: '1 week',
    workspaceEnabled: true,
    academyEnabled: false,
    communityEnabled: true,
    aiEnabled: false,
    partnerOffers: [],
    rewardPoints: 50,
  },
]

export const STATIC_PRODUCTS: Product[] = RAW.map((snapshot) => published(snapshot, '2026-06-01T00:00:00.000Z'))
