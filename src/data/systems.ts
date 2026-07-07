import type { BusinessSystem, SystemComponent } from '../types/system'

export const CATEGORIES = [
  'All',
  'Notary',
  'Cleaning',
  'Bookkeeping',
  'Delivery',
] as const

const genericReviews = [
  { name: 'Jessica M.', role: 'Notary Public, California', quote: 'The systems are incredibly easy to follow. Instead of wondering what to do next, I simply follow the workflow.', rating: 5 },
  { name: 'David R.', role: 'Cleaning Business Owner', quote: 'I launched my business in less than three weeks because everything was already organized.', rating: 5 },
  { name: 'Amanda S.', role: 'Bookkeeper', quote: 'The planners helped me stop feeling overwhelmed.', rating: 5 },
]

const genericFaq = [
  { question: 'How do I access my system after purchase?', answer: 'It opens instantly online from My Systems — no download required, no waiting for an email.' },
  { question: 'Can I use this on my phone or tablet?', answer: 'Yes. Every system is fully responsive and works the same on desktop, tablet, and mobile.' },
  { question: 'Can I print it or save it as a PDF?', answer: 'Yes. Use the Print or Save PDF buttons at the top of the system at any time.' },
  { question: 'Does my progress save automatically?', answer: 'No — this system does not store data. Complete a session and print or save your results before closing the page.' },
]

// --- Components (Planner™ / Workflow™ / Toolkit™) -------------------------
// Independent, reusable content units. A Business System bundles one or
// more of these. Only the first component of a system renders on the
// Interactive System page this sprint — the shape already supports more.

const notaryJourneyPlanner: SystemComponent = {
  id: 'notary-journey-planner',
  name: 'Notary Journey Planner™',
  type: 'Planner',
  description: 'Confirm the fundamentals before your first appointment.',
  content: [
    {
      id: 'setup',
      title: 'Business Setup',
      description: 'Confirm the fundamentals before your first appointment.',
      fields: [
        { id: 'entity', type: 'checkbox', label: 'Business entity registered' },
        { id: 'bond', type: 'checkbox', label: 'Notary bond and E&O insurance active' },
        { id: 'startDate', type: 'date', label: 'Target launch date' },
        { id: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Anything to remember for this step…' },
      ],
    },
    {
      id: 'pricing',
      title: 'Pricing & Service Area',
      fields: [
        { id: 'baseFee', type: 'text', label: 'Base signing fee', placeholder: '$150' },
        { id: 'travelFee', type: 'text', label: 'Travel fee', placeholder: '$0.70 / mile' },
        { id: 'coverage', type: 'checkbox', label: 'Service area map defined' },
      ],
    },
    {
      id: 'launch',
      title: 'Launch Readiness',
      fields: [
        { id: 'profile', type: 'checkbox', label: 'Signing service profiles created' },
        { id: 'website', type: 'checkbox', label: 'Booking page published' },
        { id: 'firstJob', type: 'checkbox', label: 'First signing completed' },
      ],
    },
  ],
}

const notaryEquipmentPlanner: SystemComponent = {
  id: 'notary-equipment-planner',
  name: 'Notary Equipment Planner™',
  type: 'Planner',
  description: 'Know exactly what to buy, in what order, and what it actually costs.',
  content: [
    {
      id: 'core',
      title: 'Core Equipment',
      fields: [
        { id: 'stamp', type: 'checkbox', label: 'Notary stamp & seal ordered' },
        { id: 'journal', type: 'checkbox', label: 'Journal (digital or paper) selected' },
        { id: 'printer', type: 'checkbox', label: 'Portable printer/scanner acquired' },
      ],
    },
    {
      id: 'budget',
      title: 'Budget',
      fields: [
        { id: 'startupBudget', type: 'text', label: 'Startup equipment budget', placeholder: '$450' },
        { id: 'notes', type: 'textarea', label: 'Notes' },
      ],
    },
  ],
}

const notaryServiceWorkflow: SystemComponent = {
  id: 'notary-service-workflow',
  name: 'Notary Service Workflow™',
  type: 'Workflow',
  description: 'Run signings, journals, and client communication in one repeatable flow.',
  content: [
    {
      id: 'confirm',
      title: 'Appointment Confirmation',
      fields: [
        { id: 'clientName', type: 'text', label: 'Client name' },
        { id: 'apptDate', type: 'date', label: 'Appointment date' },
        { id: 'confirmed', type: 'checkbox', label: 'Confirmation sent to client' },
      ],
    },
    {
      id: 'journal',
      title: 'Journal Entry',
      fields: [
        { id: 'docType', type: 'text', label: 'Document type' },
        { id: 'idVerified', type: 'checkbox', label: 'ID verified' },
        { id: 'signed', type: 'checkbox', label: 'Signing completed' },
      ],
    },
    {
      id: 'return',
      title: 'Document Return',
      fields: [
        { id: 'returned', type: 'checkbox', label: 'Documents returned to title/lender' },
        { id: 'notes', type: 'textarea', label: 'Notes' },
      ],
    },
  ],
}

const notarySigningAgentWorkflow: SystemComponent = {
  id: 'notary-signing-agent-workflow',
  name: 'Notary Signing Agent Workflow™',
  type: 'Workflow',
  description: 'Track borrower details, document sets, and funding status on loan signings.',
  content: [
    {
      id: 'borrower',
      title: 'Borrower Details',
      fields: [
        { id: 'borrower', type: 'text', label: 'Borrower name' },
        { id: 'coBorrower', type: 'text', label: 'Co-borrower name' },
        { id: 'lender', type: 'text', label: 'Lender / title company' },
      ],
    },
    {
      id: 'docs',
      title: 'Document Set',
      fields: [
        { id: 'setComplete', type: 'checkbox', label: 'Full document set received' },
        { id: 'printed', type: 'checkbox', label: 'Documents printed' },
      ],
    },
    {
      id: 'funding',
      title: 'Funding',
      fields: [
        { id: 'funded', type: 'checkbox', label: 'Loan funded' },
        { id: 'filed', type: 'checkbox', label: 'Documents filed / recorded' },
      ],
    },
  ],
}

const cleaningLaunchToolkit: SystemComponent = {
  id: 'cleaning-launch-toolkit',
  name: 'Cleaning Launch Toolkit™',
  type: 'Toolkit',
  description: 'Pricing, crew setup, and client intake in one place.',
  content: [
    {
      id: 'pricing',
      title: 'Pricing',
      fields: [
        { id: 'baseRate', type: 'text', label: 'Base rate per visit', placeholder: '$120' },
        { id: 'deepSurcharge', type: 'text', label: 'Deep clean surcharge (%)', placeholder: '25%' },
      ],
    },
    {
      id: 'crew',
      title: 'Crew Setup',
      fields: [
        { id: 'firstHire', type: 'checkbox', label: 'First team member onboarded' },
        { id: 'payStructure', type: 'text', label: 'Pay structure', placeholder: 'Hourly / percent / fixed' },
      ],
    },
  ],
}

const bookkeepingCloseWorkflow: SystemComponent = {
  id: 'bookkeeping-close-workflow',
  name: 'Monthly Close Workflow™',
  type: 'Workflow',
  description: 'The same short, repeatable close — every month.',
  content: [
    {
      id: 'close',
      title: 'Monthly Close',
      fields: [
        { id: 'reconciled', type: 'checkbox', label: 'Bank accounts reconciled' },
        { id: 'categorized', type: 'checkbox', label: 'Transactions categorized' },
        { id: 'closeDate', type: 'date', label: 'Close date' },
      ],
    },
  ],
}

// --- Business Systems (the products customers actually purchase) --------

export const SYSTEMS: BusinessSystem[] = [
  {
    slug: 'start-your-notary-business',
    name: 'Start Your Notary Business™',
    category: 'Notary',
    type: 'Business Launch System',
    shortDescription: 'A complete launch path from licensing to your first signing appointment.',
    description:
      'Start Your Notary Business™ walks you through every decision required to launch, in the order you actually need to make them — entity setup, bonding and insurance, pricing, service area, equipment, and your first booking.',
    modules: 8,
    estimatedTime: '2–3 weeks',
    difficulty: 'Beginner',
    price: 79,
    memberPrice: 63,
    checkoutUrl: 'https://checkout.bgrowth.com/start-your-notary-business',
    audience: ['First-time notaries', 'Side-hustlers going full-time', 'Anyone licensed but not yet booking jobs'],
    relatedSlugs: ['notary-equipment-planner', 'daily-notary-operations'],
    features: [
      { title: 'Guided sequence', description: 'Every step unlocks the next — no guesswork about order.' },
      { title: 'Built-in pricing worksheet', description: 'Set your fees with a framework, not a guess.' },
      { title: 'Launch-ready plan', description: 'Know exactly when you\u2019re ready for your first job.' },
    ],
    whatsIncluded: [
      'Notary Journey Planner™',
      'Notary Equipment Planner™',
      'Resources™',
      'Affiliate Recommendations',
    ],
    resources: [
      { title: 'State Bonding Requirements Guide', type: 'Guide' },
      { title: 'Fee Schedule Template', type: 'Template' },
    ],
    reviews: genericReviews,
    faq: genericFaq,
    components: [notaryJourneyPlanner, notaryEquipmentPlanner],
  },
  {
    slug: 'notary-equipment-planner',
    name: 'Notary Equipment System™',
    category: 'Notary',
    type: 'Toolkit System',
    shortDescription: 'Know exactly what to buy, in what order, and what it actually costs.',
    description:
      'Cut through conflicting advice about what a mobile notary actually needs. This planner lists every tool by priority and estimated cost so you spend only where it matters.',
    modules: 4,
    estimatedTime: '3 days',
    difficulty: 'Beginner',
    price: 39,
    memberPrice: 31,
    checkoutUrl: 'https://checkout.bgrowth.com/notary-equipment-planner',
    audience: ['New notaries outfitting for the first time', 'Anyone unsure what equipment is actually necessary'],
    relatedSlugs: ['start-your-notary-business', 'daily-notary-operations'],
    features: [
      { title: 'Priority-ranked list', description: 'Buy what matters first, add the rest later.' },
      { title: 'Budget worksheet', description: 'Plan spend across startup and month two.' },
    ],
    whatsIncluded: ['Notary Equipment Planner™', 'Resources™'],
    resources: [{ title: 'Supplier Shortlist', type: 'Resource' }],
    reviews: genericReviews.slice(0, 2),
    faq: genericFaq,
    components: [notaryEquipmentPlanner],
  },
  {
    slug: 'daily-notary-operations',
    name: 'Daily Notary Operations™',
    category: 'Notary',
    type: 'Business Operations System',
    shortDescription: 'Run signings, journals, and client communication in one repeatable flow.',
    description:
      'The day-to-day operating system for a working notary — from appointment confirmation through document return, so nothing gets missed on a busy week.',
    modules: 6,
    estimatedTime: 'Ongoing',
    difficulty: 'Intermediate',
    price: 59,
    memberPrice: 47,
    checkoutUrl: 'https://checkout.bgrowth.com/daily-notary-operations',
    audience: ['Working notaries booking signings weekly', 'Anyone juggling client comms and journal entries by hand'],
    relatedSlugs: ['start-your-notary-business', 'notary-signing-agent-workflow'],
    features: [
      { title: 'Repeatable per-job flow', description: 'The same reliable sequence, every signing.' },
      { title: 'Client communication prompts', description: 'Know what to send and when.' },
    ],
    whatsIncluded: ['Notary Service Workflow™', 'Resources™', 'Certificates', 'Affiliate Products'],
    resources: [{ title: 'Confirmation Email Template', type: 'Template' }],
    reviews: genericReviews,
    faq: genericFaq,
    components: [notaryServiceWorkflow],
  },
  {
    slug: 'notary-signing-agent-workflow',
    name: 'Notary Signing Agent System™',
    category: 'Notary',
    type: 'Business Operations System',
    shortDescription: 'Step-by-step process from confirmation to funded and filed.',
    description:
      'Built specifically for loan signings — track borrower details, document sets, and funding status from confirmation through completion.',
    modules: 5,
    estimatedTime: '1 week setup',
    difficulty: 'Advanced',
    price: 59,
    memberPrice: 47,
    checkoutUrl: 'https://checkout.bgrowth.com/notary-signing-agent-workflow',
    audience: ['Notaries specializing in loan signings', 'Anyone expanding from general notary work into signing agent work'],
    relatedSlugs: ['daily-notary-operations', 'start-your-notary-business'],
    features: [
      { title: 'Loan-specific fields', description: 'Borrower, co-borrower, and lender tracked together.' },
      { title: 'Funding status tracker', description: 'Know what\u2019s outstanding at a glance.' },
    ],
    whatsIncluded: ['Notary Signing Agent Workflow™', 'Resources™'],
    resources: [{ title: 'Borrower Intake Template', type: 'Template' }],
    reviews: genericReviews.slice(0, 2),
    faq: genericFaq,
    components: [notarySigningAgentWorkflow],
  },
  {
    slug: 'cleaning-business-launch',
    name: 'Cleaning Business Launch™',
    category: 'Cleaning',
    type: 'Business Launch System',
    shortDescription: 'Pricing, crews, and client intake — organized before your first job.',
    description:
      'Everything needed to open your cleaning business the right way: pricing structure, crew setup, and your first client intake flow.',
    modules: 9,
    estimatedTime: '2 weeks',
    difficulty: 'Beginner',
    price: 79,
    memberPrice: 63,
    checkoutUrl: 'https://checkout.bgrowth.com/cleaning-business-launch',
    audience: ['First-time cleaning business owners', 'Solo cleaners ready to hire their first team member'],
    relatedSlugs: ['bookkeeping-operations'],
    features: [
      { title: 'Room-based pricing model', description: 'Price consistently across every job.' },
      { title: 'Crew setup guide', description: 'Structure pay before you hire.' },
    ],
    whatsIncluded: ['Cleaning Launch Toolkit™', 'Resources™'],
    resources: [{ title: 'Pricing Worksheet', type: 'Template' }],
    reviews: genericReviews,
    faq: genericFaq,
    components: [cleaningLaunchToolkit],
  },
  {
    slug: 'bookkeeping-operations',
    name: 'Bookkeeping Operations™',
    category: 'Bookkeeping',
    type: 'Business Operations System',
    shortDescription: 'A monthly close process built for service businesses, not accountants.',
    description:
      'A repeatable monthly close designed for owner-operators — reconcile, categorize, and report without needing an accounting background.',
    modules: 7,
    estimatedTime: 'Ongoing',
    difficulty: 'Intermediate',
    price: 69,
    memberPrice: 55,
    checkoutUrl: 'https://checkout.bgrowth.com/bookkeeping-operations',
    audience: ['Service business owners doing their own books', 'Anyone dreading the monthly close'],
    relatedSlugs: ['cleaning-business-launch'],
    features: [
      { title: 'Monthly close plan', description: 'The same short list, every month.' },
      { title: 'Plain-language categories', description: 'No accounting jargon required.' },
    ],
    whatsIncluded: ['Monthly Close Workflow™', 'Resources™'],
    resources: [{ title: 'Category Reference Sheet', type: 'Resource' }],
    reviews: genericReviews.slice(0, 2),
    faq: genericFaq,
    components: [bookkeepingCloseWorkflow],
  },
]

export function getSystemBySlug(slug: string) {
  return SYSTEMS.find((s) => s.slug === slug)
}

export function getRelatedSystems(system: BusinessSystem) {
  return system.relatedSlugs
    .map((slug) => getSystemBySlug(slug))
    .filter((s): s is BusinessSystem => Boolean(s))
}
