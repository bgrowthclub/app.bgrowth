import type { SystemResource, AffiliatePartner } from '../types/system'

export const FREE_DOWNLOADS: SystemResource[] = [
  { title: 'New Business Launch Checklist', type: 'Template' },
  { title: 'Service Pricing Worksheet', type: 'Template' },
  { title: 'Client Intake Form', type: 'Resource' },
]

export const BUSINESS_GUIDES: SystemResource[] = [
  { title: 'Choosing a Business Entity', type: 'Guide' },
  { title: 'Getting Bonded & Insured', type: 'Guide' },
  { title: 'Setting Your First Price', type: 'Guide' },
]

export const TEMPLATES: SystemResource[] = [
  { title: 'Client Confirmation Email', type: 'Template' },
  { title: 'Monthly Close Sheet', type: 'Template' },
  { title: 'Service Agreement', type: 'Template' },
]

export const BUSINESS_DOCUMENTS: SystemResource[] = [
  { title: 'Independent Contractor Agreement', type: 'Resource' },
  { title: 'W-9 Request Template', type: 'Resource' },
]

export const RECOMMENDED_TOOLS: AffiliatePartner[] = [
  { id: 'tool-quickbooks', name: 'QuickBooks Self-Employed', description: 'Bookkeeping built for solo service businesses.', url: 'https://example.com/quickbooks' },
  { id: 'tool-calendly', name: 'Calendly', description: 'Booking pages that sync with your calendar.', url: 'https://example.com/calendly' },
  { id: 'tool-canva', name: 'Canva', description: 'Simple design tool for flyers, receipts, and social posts.', url: 'https://example.com/canva' },
]

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  { id: 'affiliate-bonding', name: 'SuretyBond Direct', description: 'Bonds and E&O insurance, issued same-day.', url: 'https://example.com/suretybond' },
  { id: 'affiliate-legalzoom', name: 'Business Formation Co.', description: 'Register your LLC or entity online.', url: 'https://example.com/formation' },
]

export interface Article {
  title: string
  excerpt: string
  readTime: string
  category: string
}

export const ARTICLES: Article[] = [
  {
    title: 'How to Price a Service Business Without Guessing',
    excerpt: 'A simple framework for setting fees that cover your time and still win the job.',
    readTime: '6 min read',
    category: 'Pricing',
  },
  {
    title: 'The First 90 Days of Running Your Own Business',
    excerpt: 'What to prioritize, and what can safely wait, in your first quarter.',
    readTime: '8 min read',
    category: 'Getting Started',
  },
  {
    title: 'Bonded vs. Insured: What\u2019s Actually Required',
    excerpt: 'A plain-language breakdown of the coverage most service businesses need.',
    readTime: '5 min read',
    category: 'Compliance',
  },
]

export const STATE_RESOURCES = [
  'California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia',
]
