import { Stamp, Sparkles, Calculator, Truck, Layers } from 'lucide-react'

export const ICONS_BY_CATEGORY: Record<string, typeof Stamp> = {
  Notary: Stamp,
  Cleaning: Sparkles,
  Bookkeeping: Calculator,
  Delivery: Truck,
  Default: Layers,
}
