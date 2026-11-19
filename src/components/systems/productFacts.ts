import { Download, MonitorSmartphone, Save, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Moved here from StudioPurchaseCard on 19/11/2026 so the catalog cards show
// the same facts (by the product's kind: Workspace, Calculator, Course,
// Download).
// Three short facts shown as icons above the price (16/11/2026, the owner's
// design) — true of every product of that type; nothing is promised that the
// product doesn't do.
export type ProductFact = { icon: LucideIcon; text: string }
export const PRODUCT_FACTS: Record<string, ProductFact[]> = {
  Workspace: [
    { icon: Zap, text: 'Ready to use' },
    { icon: Save, text: 'Saves your progress' },
    { icon: MonitorSmartphone, text: 'Phone & computer' },
  ],
  Calculator: [
    { icon: Zap, text: 'Results as you type' },
    { icon: Save, text: 'Saves your calculations' },
    { icon: MonitorSmartphone, text: 'Phone & computer' },
  ],
  Course: [
    { icon: Zap, text: 'At your own pace' },
    { icon: Save, text: 'Progress saved' },
    { icon: MonitorSmartphone, text: 'Phone & computer' },
  ],
  Download: [
    { icon: Download, text: 'Instant download' },
    { icon: Save, text: 'Yours to keep' },
    { icon: MonitorSmartphone, text: 'Print-ready PDF' },
  ],
}

