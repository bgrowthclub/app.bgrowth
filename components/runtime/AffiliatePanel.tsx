import { ArrowUpRight, Handshake } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import type { AffiliatePartner } from '../../types/system'

export default function AffiliatePanel({ partners }: { partners: AffiliatePartner[] }) {
  if (partners.length === 0) return null
  return (
    <div>
      <SectionHeader eyebrow="Affiliate Partners" title="Recommended for this system" className="mb-8" />
      <div className="grid gap-3 sm:grid-cols-2">
        {partners.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3.5 rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-softer transition-colors hover:border-primary/20"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bg-soft text-primary">
              <Handshake size={17} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold text-navy">{p.name}</p>
              <p className="mt-0.5 text-[12.5px] text-navy/45">{p.description}</p>
            </div>
            <ArrowUpRight size={14} className="mt-1 shrink-0 text-navy/25 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        ))}
      </div>
    </div>
  )
}
