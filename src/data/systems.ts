import type { BusinessSystem, BusinessModule } from '../types/system'

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
  { name: 'Marcus T.', role: 'Delivery Driver', quote: 'I stopped guessing what to buy and what to charge. Everything was laid out in order.', rating: 5 },
]

const genericFaq = [
  { question: 'How do I access my system after purchase?', answer: 'It opens instantly online from My Systems — no download required, no waiting for an email.' },
  { question: 'Can I use this on my phone or tablet?', answer: 'Yes. Every system is fully responsive and works the same on desktop, tablet, and mobile.' },
  { question: 'Can I print it or save it as a PDF?', answer: 'Yes. Use the Print or Save PDF buttons at the top of each module at any time.' },
  { question: 'Does my progress save automatically?', answer: 'No — modules do not store data. Complete a session and print or save your results before closing the page.' },
]

const genericAffiliates = [
  { id: 'affiliate-bonding', name: 'SuretyBond Direct', description: 'Notary bonds and E&O insurance, issued same-day.', url: 'https://example.com/suretybond' },
  { id: 'affiliate-stamp', name: 'NotaryStamp Co.', description: 'State-compliant stamps, seals, and journals.', url: 'https://example.com/notarystamp' },
]

const deliveryAffiliates = [
  { id: 'affiliate-mileage-app', name: 'MileIQ Pro', description: 'Automatic mileage tracking for tax deductions.', url: 'https://example.com/mileiq' },
  { id: 'affiliate-cargo', name: 'RouteGear', description: 'Insulated delivery bags and cargo organizers.', url: 'https://example.com/routegear' },
]

// --- Modules (Planner™ / Workflow™ / Toolkit™) -----------------------------
// Independent, reusable units exported from BGrowth Studio. A Business
// System bundles one or more of these. The Runtime only ever displays this
// content — it's produced by Studio's Checklist/Planner/Workflow/Template
// builders, none of which live in this project.

const notaryJourneyPlanner: BusinessModule = {
  id: 'notary-journey-planner',
  title: 'Notary Journey Planner™',
  type: 'Planner',
  description: 'Confirm the fundamentals before your first appointment.',
  estimatedTime: '20 min',
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

const notaryEquipmentPlanner: BusinessModule = {
  id: 'notary-equipment-planner',
  title: 'Notary Equipment Planner™',
  type: 'Planner',
  description: 'Know exactly what to buy, in what order, and what it actually costs.',
  estimatedTime: '10 min',
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

const notaryServiceWorkflow: BusinessModule = {
  id: 'notary-service-workflow',
  title: 'Notary Service Workflow™',
  type: 'Workflow',
  description: 'Run signings, journals, and client communication in one repeatable flow.',
  estimatedTime: '15 min per job',
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

const notarySigningAgentWorkflow: BusinessModule = {
  id: 'notary-signing-agent-workflow',
  title: 'Notary Signing Agent Workflow™',
  type: 'Workflow',
  description: 'Track borrower details, document sets, and funding status on loan signings.',
  estimatedTime: '20 min per job',
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

const cleaningLaunchToolkit: BusinessModule = {
  id: 'cleaning-launch-toolkit',
  title: 'Cleaning Launch Toolkit™',
  type: 'Toolkit',
  description: 'Pricing, crew setup, and client intake in one place.',
  estimatedTime: '15 min',
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

const bookkeepingCloseWorkflow: BusinessModule = {
  id: 'bookkeeping-close-workflow',
  title: 'Monthly Close Workflow™',
  type: 'Workflow',
  description: 'The same short, repeatable close — every month.',
  estimatedTime: '30 min per month',
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

const deliveryBusinessLaunchPlanner: BusinessModule = {
  id: 'delivery-business-launch-planner',
  title: 'Delivery Business Launch Planner™',
  type: 'Planner',
  description: 'Confirm the fundamentals before your first route.',
  estimatedTime: '15 min',
  content: [
    {
      id: 'setup',
      title: 'Business Setup',
      description: 'Confirm the fundamentals before your first route.',
      fields: [
        { id: 'entity', type: 'checkbox', label: 'Business entity registered' },
        { id: 'insurance', type: 'checkbox', label: 'Commercial auto insurance active' },
        { id: 'vehicleRegistered', type: 'checkbox', label: 'Vehicle registered for commercial use' },
        { id: 'startDate', type: 'date', label: 'Target launch date' },
        { id: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Anything to remember for this step…' },
      ],
    },
    {
      id: 'coverage',
      title: 'Service Area & Pricing',
      fields: [
        { id: 'deliveryRadius', type: 'text', label: 'Delivery radius', placeholder: '15 miles' },
        { id: 'baseRate', type: 'text', label: 'Base delivery rate', placeholder: '$8 per delivery' },
        { id: 'mileageRate', type: 'text', label: 'Per-mile rate', placeholder: '$0.65 / mile' },
        { id: 'rushFee', type: 'text', label: 'Rush fee', placeholder: '$5' },
      ],
    },
    {
      id: 'launch',
      title: 'Launch Readiness',
      fields: [
        { id: 'platformProfiles', type: 'checkbox', label: 'Delivery platform profiles created' },
        { id: 'localListings', type: 'checkbox', label: 'Local business listing published' },
        { id: 'firstDelivery', type: 'checkbox', label: 'First delivery completed' },
      ],
    },
  ],
}

const deliveryVehicleEquipmentPlanner: BusinessModule = {
  id: 'delivery-vehicle-equipment-planner',
  title: 'Delivery Vehicle & Equipment Planner™',
  type: 'Planner',
  description: 'Know exactly what to buy, in what order, and what it actually costs.',
  estimatedTime: '10 min',
  content: [
    {
      id: 'core',
      title: 'Core Equipment',
      fields: [
        { id: 'insulatedBags', type: 'checkbox', label: 'Insulated delivery bags acquired' },
        { id: 'dolly', type: 'checkbox', label: 'Hand truck / dolly acquired' },
        { id: 'phoneMount', type: 'checkbox', label: 'Phone mount & GPS ready' },
        { id: 'mileageApp', type: 'checkbox', label: 'Mileage tracking app installed' },
      ],
    },
    {
      id: 'budget',
      title: 'Budget',
      fields: [
        { id: 'startupBudget', type: 'text', label: 'Startup equipment budget', placeholder: '$300' },
        { id: 'notes', type: 'textarea', label: 'Notes' },
      ],
    },
  ],
}

const dailyDeliveryOperationsWorkflow: BusinessModule = {
  id: 'daily-delivery-operations-workflow',
  title: 'Daily Delivery Operations Workflow™',
  type: 'Workflow',
  description: 'Run pickups, deliveries, and payment in one repeatable flow.',
  estimatedTime: '10 min per route',
  content: [
    {
      id: 'pickup',
      title: 'Pickup Confirmation',
      fields: [
        { id: 'customerName', type: 'text', label: 'Customer name' },
        { id: 'pickupAddress', type: 'text', label: 'Pickup address' },
        { id: 'pickupTime', type: 'text', label: 'Pickup time', placeholder: '2:00 PM' },
        { id: 'confirmed', type: 'checkbox', label: 'Pickup confirmed with customer' },
      ],
    },
    {
      id: 'delivery',
      title: 'Delivery Execution',
      fields: [
        { id: 'deliveryAddress', type: 'text', label: 'Delivery address' },
        { id: 'proofCaptured', type: 'checkbox', label: 'Proof of delivery captured' },
        { id: 'onTime', type: 'checkbox', label: 'Delivered on time' },
      ],
    },
    {
      id: 'wrapup',
      title: 'Wrap-Up',
      fields: [
        { id: 'mileageLogged', type: 'checkbox', label: 'Mileage logged' },
        { id: 'paymentCollected', type: 'checkbox', label: 'Payment collected or invoiced' },
        { id: 'notes', type: 'textarea', label: 'Notes' },
      ],
    },
  ],
}

// --- Business Systems (the packages customers actually purchase) --------

export const SYSTEMS: BusinessSystem[] = [
  {
    id: 'sys-001',
    slug: 'start-your-notary-business',
    title: 'Start Your Notary Business™',
    subtitle: 'Everything to go from licensed to booked.',
    industry: 'Legal',
    category: 'Notary',
    type: 'Business Launch System',
    shortDescription: 'A complete launch path from licensing to your first signing appointment.',
    description:
      'Start Your Notary Business™ walks you through every decision required to launch, in the order you actually need to make them — entity setup, bonding and insurance, pricing, service area, equipment, and your first booking.',
    estimatedTime: '2–3 weeks',
    difficulty: 'Beginner',
    price: 79,
    memberPrice: 63,
    checkoutUrl: 'https://checkout.bgrowth.com/start-your-notary-business',
    whoIsFor: ['First-time notaries', 'Side-hustlers going full-time', 'Anyone licensed but not yet booking jobs'],
    relatedSystems: ['notary-equipment-planner', 'daily-notary-operations'],
    tags: ['notary', 'launch', 'beginner'],
    status: 'published',
    featured: true,
    benefits: [
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
    affiliatePartners: genericAffiliates,
    reviews: genericReviews,
    faq: genericFaq,
    modules: [notaryJourneyPlanner, notaryEquipmentPlanner],
  },
  {
    id: 'sys-002',
    slug: 'notary-equipment-planner',
    title: 'Notary Equipment System™',
    subtitle: 'Buy the right gear, once.',
    industry: 'Legal',
    category: 'Notary',
    type: 'Toolkit System',
    shortDescription: 'Know exactly what to buy, in what order, and what it actually costs.',
    description:
      'Cut through conflicting advice about what a mobile notary actually needs. This system lists every tool by priority and estimated cost so you spend only where it matters.',
    estimatedTime: '3 days',
    difficulty: 'Beginner',
    price: 39,
    memberPrice: 31,
    checkoutUrl: 'https://checkout.bgrowth.com/notary-equipment-planner',
    whoIsFor: ['New notaries outfitting for the first time', 'Anyone unsure what equipment is actually necessary'],
    relatedSystems: ['start-your-notary-business', 'daily-notary-operations'],
    tags: ['notary', 'equipment'],
    status: 'published',
    featured: true,
    benefits: [
      { title: 'Priority-ranked list', description: 'Buy what matters first, add the rest later.' },
      { title: 'Budget worksheet', description: 'Plan spend across startup and month two.' },
    ],
    whatsIncluded: ['Notary Equipment Planner™', 'Resources™'],
    resources: [{ title: 'Supplier Shortlist', type: 'Resource' }],
    affiliatePartners: genericAffiliates.slice(1),
    reviews: genericReviews.slice(0, 2),
    faq: genericFaq,
    modules: [notaryEquipmentPlanner],
  },
  {
    id: 'sys-003',
    slug: 'daily-notary-operations',
    title: 'Daily Notary Operations™',
    subtitle: 'Run every signing the same reliable way.',
    industry: 'Legal',
    category: 'Notary',
    type: 'Business Operations System',
    shortDescription: 'Run signings, journals, and client communication in one repeatable flow.',
    description:
      'The day-to-day operating system for a working notary — from appointment confirmation through document return, so nothing gets missed on a busy week.',
    estimatedTime: 'Ongoing',
    difficulty: 'Intermediate',
    price: 59,
    memberPrice: 47,
    checkoutUrl: 'https://checkout.bgrowth.com/daily-notary-operations',
    whoIsFor: ['Working notaries booking signings weekly', 'Anyone juggling client comms and journal entries by hand'],
    relatedSystems: ['start-your-notary-business', 'notary-signing-agent-workflow'],
    tags: ['notary', 'operations'],
    status: 'published',
    featured: true,
    benefits: [
      { title: 'Repeatable per-job flow', description: 'The same reliable sequence, every signing.' },
      { title: 'Client communication prompts', description: 'Know what to send and when.' },
    ],
    whatsIncluded: ['Notary Service Workflow™', 'Resources™', 'Certificates', 'Affiliate Products'],
    resources: [{ title: 'Confirmation Email Template', type: 'Template' }],
    affiliatePartners: genericAffiliates,
    reviews: genericReviews,
    faq: genericFaq,
    modules: [notaryServiceWorkflow],
  },
  {
    id: 'sys-004',
    slug: 'notary-signing-agent-workflow',
    title: 'Notary Signing Agent System™',
    subtitle: 'Purpose-built for loan signings.',
    industry: 'Legal',
    category: 'Notary',
    type: 'Business Operations System',
    shortDescription: 'Step-by-step process from confirmation to funded and filed.',
    description:
      'Built specifically for loan signings — track borrower details, document sets, and funding status from confirmation through completion.',
    estimatedTime: '1 week setup',
    difficulty: 'Advanced',
    price: 59,
    memberPrice: 47,
    checkoutUrl: 'https://checkout.bgrowth.com/notary-signing-agent-workflow',
    whoIsFor: ['Notaries specializing in loan signings', 'Anyone expanding from general notary work into signing agent work'],
    relatedSystems: ['daily-notary-operations', 'start-your-notary-business'],
    tags: ['notary', 'loan-signing', 'advanced'],
    status: 'published',
    featured: false,
    benefits: [
      { title: 'Loan-specific fields', description: 'Borrower, co-borrower, and lender tracked together.' },
      { title: 'Funding status tracker', description: 'Know what\u2019s outstanding at a glance.' },
    ],
    whatsIncluded: ['Notary Signing Agent Workflow™', 'Resources™'],
    resources: [{ title: 'Borrower Intake Template', type: 'Template' }],
    affiliatePartners: genericAffiliates.slice(0, 1),
    reviews: genericReviews.slice(0, 2),
    faq: genericFaq,
    modules: [notarySigningAgentWorkflow],
  },
  {
    id: 'sys-005',
    slug: 'cleaning-business-launch',
    title: 'Cleaning Business Launch™',
    subtitle: 'Open the right way, from job one.',
    industry: 'Cleaning',
    category: 'Cleaning',
    type: 'Business Launch System',
    shortDescription: 'Pricing, crews, and client intake — organized before your first job.',
    description:
      'Everything needed to open your cleaning business the right way: pricing structure, crew setup, and your first client intake flow.',
    estimatedTime: '2 weeks',
    difficulty: 'Beginner',
    price: 79,
    memberPrice: 63,
    checkoutUrl: 'https://checkout.bgrowth.com/cleaning-business-launch',
    whoIsFor: ['First-time cleaning business owners', 'Solo cleaners ready to hire their first team member'],
    relatedSystems: ['bookkeeping-operations'],
    tags: ['cleaning', 'launch'],
    status: 'published',
    featured: false,
    benefits: [
      { title: 'Room-based pricing model', description: 'Price consistently across every job.' },
      { title: 'Crew setup guide', description: 'Structure pay before you hire.' },
    ],
    whatsIncluded: ['Cleaning Launch Toolkit™', 'Resources™'],
    resources: [{ title: 'Pricing Worksheet', type: 'Template' }],
    affiliatePartners: [],
    reviews: genericReviews,
    faq: genericFaq,
    modules: [cleaningLaunchToolkit],
  },
  {
    id: 'sys-006',
    slug: 'bookkeeping-operations',
    title: 'Bookkeeping Operations™',
    subtitle: 'A close you can actually keep up with.',
    industry: 'Financial',
    category: 'Bookkeeping',
    type: 'Business Operations System',
    shortDescription: 'A monthly close process built for service businesses, not accountants.',
    description:
      'A repeatable monthly close designed for owner-operators — reconcile, categorize, and report without needing an accounting background.',
    estimatedTime: 'Ongoing',
    difficulty: 'Intermediate',
    price: 69,
    memberPrice: 55,
    checkoutUrl: 'https://checkout.bgrowth.com/bookkeeping-operations',
    whoIsFor: ['Service business owners doing their own books', 'Anyone dreading the monthly close'],
    relatedSystems: ['cleaning-business-launch'],
    tags: ['bookkeeping', 'operations'],
    status: 'published',
    featured: false,
    benefits: [
      { title: 'Monthly close plan', description: 'The same short list, every month.' },
      { title: 'Plain-language categories', description: 'No accounting jargon required.' },
    ],
    whatsIncluded: ['Monthly Close Workflow™', 'Resources™'],
    resources: [{ title: 'Category Reference Sheet', type: 'Resource' }],
    affiliatePartners: [],
    reviews: genericReviews.slice(0, 2),
    faq: genericFaq,
    modules: [bookkeepingCloseWorkflow],
  },
  {
    id: 'sys-007',
    slug: 'start-your-delivery-business',
    title: 'Start Your Delivery Business™',
    subtitle: 'From vehicle-ready to first delivery.',
    industry: 'Logistics',
    category: 'Delivery',
    type: 'Business Launch System',
    shortDescription: 'A complete launch path from vehicle setup to your first paid delivery.',
    description:
      'Start Your Delivery Business™ walks you through every decision required to launch a local delivery or courier business, in the order you actually need to make them — insurance and registration, service area and pricing, equipment, and your first delivery.',
    estimatedTime: '1–2 weeks',
    difficulty: 'Beginner',
    price: 79,
    memberPrice: 63,
    checkoutUrl: 'https://checkout.bgrowth.com/start-your-delivery-business',
    whoIsFor: ['First-time delivery or courier business owners', 'Rideshare drivers moving into deliveries', 'Anyone with a vehicle looking for a low-overhead launch'],
    relatedSystems: ['delivery-vehicle-equipment', 'daily-delivery-operations'],
    tags: ['delivery', 'launch', 'beginner'],
    status: 'published',
    featured: false,
    benefits: [
      { title: 'Guided sequence', description: 'Every step unlocks the next — no guesswork about order.' },
      { title: 'Built-in rate worksheet', description: 'Set your delivery rates with a framework, not a guess.' },
      { title: 'Launch-ready plan', description: 'Know exactly when you’re ready for your first route.' },
    ],
    whatsIncluded: [
      'Delivery Business Launch Planner™',
      'Delivery Vehicle & Equipment Planner™',
      'Resources™',
      'Affiliate Recommendations',
    ],
    resources: [
      { title: 'Local Delivery Rate Card Template', type: 'Template' },
      { title: 'Commercial Auto Insurance Guide', type: 'Guide' },
    ],
    affiliatePartners: deliveryAffiliates,
    reviews: genericReviews,
    faq: genericFaq,
    modules: [deliveryBusinessLaunchPlanner, deliveryVehicleEquipmentPlanner],
  },
  {
    id: 'sys-008',
    slug: 'delivery-vehicle-equipment',
    title: 'Delivery Vehicle & Equipment System™',
    subtitle: 'Gear up without overspending.',
    industry: 'Logistics',
    category: 'Delivery',
    type: 'Toolkit System',
    shortDescription: 'Know exactly what to buy, in what order, and what it actually costs.',
    description:
      'Cut through conflicting advice about what a delivery driver actually needs. This system lists every tool by priority and estimated cost so you spend only where it matters.',
    estimatedTime: '2 days',
    difficulty: 'Beginner',
    price: 29,
    memberPrice: 23,
    checkoutUrl: 'https://checkout.bgrowth.com/delivery-vehicle-equipment',
    whoIsFor: ['New delivery drivers outfitting for the first time', 'Anyone unsure what equipment is actually necessary'],
    relatedSystems: ['start-your-delivery-business', 'daily-delivery-operations'],
    tags: ['delivery', 'equipment'],
    status: 'published',
    featured: false,
    benefits: [
      { title: 'Priority-ranked list', description: 'Buy what matters first, add the rest later.' },
      { title: 'Budget worksheet', description: 'Plan spend across startup and month two.' },
    ],
    whatsIncluded: ['Delivery Vehicle & Equipment Planner™', 'Resources™'],
    resources: [{ title: 'Supplier Shortlist', type: 'Resource' }],
    affiliatePartners: deliveryAffiliates.slice(0, 1),
    reviews: genericReviews.slice(0, 2),
    faq: genericFaq,
    modules: [deliveryVehicleEquipmentPlanner],
  },
  {
    id: 'sys-009',
    slug: 'daily-delivery-operations',
    title: 'Daily Delivery Operations™',
    subtitle: 'Run every route the same reliable way.',
    industry: 'Logistics',
    category: 'Delivery',
    type: 'Business Operations System',
    shortDescription: 'Pickup, delivery, and wrap-up in one repeatable flow.',
    description:
      'The day-to-day operating system for a working delivery driver — from pickup confirmation through payment, so nothing gets missed on a busy route.',
    estimatedTime: 'Ongoing',
    difficulty: 'Intermediate',
    price: 49,
    memberPrice: 39,
    checkoutUrl: 'https://checkout.bgrowth.com/daily-delivery-operations',
    whoIsFor: ['Working delivery drivers running routes daily', 'Anyone juggling pickups, proof of delivery, and invoicing by hand'],
    relatedSystems: ['start-your-delivery-business', 'delivery-vehicle-equipment'],
    tags: ['delivery', 'operations'],
    status: 'published',
    featured: false,
    benefits: [
      { title: 'Repeatable per-route flow', description: 'The same reliable sequence, every delivery.' },
      { title: 'Proof-of-delivery prompts', description: 'Know what to capture and when.' },
    ],
    whatsIncluded: ['Daily Delivery Operations Workflow™', 'Resources™'],
    resources: [{ title: 'Proof of Delivery Template', type: 'Template' }],
    affiliatePartners: deliveryAffiliates.slice(1),
    reviews: genericReviews,
    faq: genericFaq,
    modules: [dailyDeliveryOperationsWorkflow],
  },
]

export function getSystemBySlug(slug: string) {
  return SYSTEMS.find((s) => s.slug === slug)
}

export function getModuleBySlug(system: BusinessSystem, moduleSlug: string) {
  return system.modules.find((m) => m.id === moduleSlug)
}

export function getRelatedSystems(system: BusinessSystem) {
  return system.relatedSystems
    .map((slug) => getSystemBySlug(slug))
    .filter((s): s is BusinessSystem => Boolean(s))
}
