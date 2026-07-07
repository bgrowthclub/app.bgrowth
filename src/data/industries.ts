import {
  Stamp,
  FileSignature,
  Sparkles,
  Waves,
  Calculator,
  FileText,
  Truck,
  Wrench,
  Car,
  Home,
  Trees,
  Trash2,
  Navigation,
  ClipboardCheck,
  HardHat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SYSTEMS } from './systems'

export interface Industry {
  slug: string
  name: string
  description: string
  icon: LucideIcon
  categoryMatch?: string // matches BusinessSystem.category — omitted where no systems exist yet
}

export const INDUSTRIES: Industry[] = [
  { slug: 'notary-public', name: 'Notary Public', description: 'General notarial services and mobile signings.', icon: Stamp, categoryMatch: 'Notary' },
  { slug: 'loan-signing-agent', name: 'Loan Signing Agent', description: 'Specialized loan document signings.', icon: FileSignature, categoryMatch: 'Notary' },
  { slug: 'cleaning-business', name: 'Cleaning Business', description: 'Residential and commercial cleaning crews.', icon: Sparkles, categoryMatch: 'Cleaning' },
  { slug: 'pressure-washing', name: 'Pressure Washing', description: 'Exterior cleaning and surface restoration.', icon: Waves },
  { slug: 'bookkeeping', name: 'Bookkeeping', description: 'Monthly close and financial operations.', icon: Calculator, categoryMatch: 'Bookkeeping' },
  { slug: 'tax-preparation', name: 'Tax Preparation', description: 'Individual and small business tax filing.', icon: FileText },
  { slug: 'delivery-driver', name: 'Delivery Driver', description: 'Routes, dispatch, and last-mile delivery.', icon: Truck, categoryMatch: 'Delivery' },
  { slug: 'handyman', name: 'Handyman', description: 'Repairs, installs, and small home projects.', icon: Wrench },
  { slug: 'car-detailing', name: 'Car Detailing', description: 'Mobile and in-shop auto detailing.', icon: Car },
  { slug: 'real-estate', name: 'Real Estate', description: 'Listings, showings, and closings.', icon: Home },
  { slug: 'landscaping', name: 'Landscaping', description: 'Lawn care, design, and maintenance.', icon: Trees },
  { slug: 'junk-removal', name: 'Junk Removal', description: 'Hauling, disposal, and cleanouts.', icon: Trash2 },
  { slug: 'mobile-notary', name: 'Mobile Notary', description: 'On-the-go notarial services by appointment.', icon: Navigation, categoryMatch: 'Notary' },
  { slug: 'home-inspection', name: 'Home Inspection', description: 'Pre-sale and buyer property inspections.', icon: ClipboardCheck },
  { slug: 'contractor', name: 'Contractor', description: 'Bids, crews, and project management.', icon: HardHat },
]

export function getIndustrySystemCount(industry: Industry) {
  if (!industry.categoryMatch) return 0
  return SYSTEMS.filter((s) => s.status === 'published' && s.category === industry.categoryMatch).length
}
