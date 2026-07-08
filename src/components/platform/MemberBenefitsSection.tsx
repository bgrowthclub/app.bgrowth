import { Star, BookOpen, GraduationCap, Store, LifeBuoy, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'

interface Benefit {
  title: string
  description: string
  icon: LucideIcon
}

// Static, page-specific config — mirrors QUICK_ACTIONS above, no data model
// needed since these are marketing statements, not Business System content.
const MEMBER_BENEFITS: Benefit[] = [
  { title: 'Exclusive Business Systems', description: 'Systems only available to BGrowth Club members.', icon: Star },
  { title: 'Premium Resources', description: 'Deeper guides, templates, and tools.', icon: BookOpen },
  { title: 'Academy Discounts', description: 'Reduced pricing on Academy courses.', icon: GraduationCap },
  { title: 'Marketplace Discounts', description: 'Member pricing with trusted partners.', icon: Store },
  { title: 'Priority Support', description: 'Jump the queue when you need help.', icon: LifeBuoy },
  { title: 'Future AI Credits', description: 'Early access to BGrowth AI, as it ships.', icon: Sparkles },
]

export default function MemberBenefitsSection() {
  return (
    <div>
      <SectionHeader eyebrow="BGrowth Club" title="Member Benefits" className="mb-6" />
      <Grid cols={3}>
        {MEMBER_BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
              <benefit.icon size={19} strokeWidth={2} />
            </div>
            <p className="mt-4 font-display text-[15px] font-bold text-navy">{benefit.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-navy/50">{benefit.description}</p>
          </div>
        ))}
      </Grid>
    </div>
  )
}
