import SectionHeader from '../ui/SectionHeader'
import FAQ from '../ui/FAQ'
import type { SystemFaq } from '../../types/system'

export default function FAQPanel({ items }: { items: SystemFaq[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <SectionHeader eyebrow="FAQ" title="Good to know" align="center" className="mx-auto mb-8" />
      <FAQ items={items} />
    </div>
  )
}
