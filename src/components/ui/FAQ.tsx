import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SystemFaq } from '../../types/system'

export default function FAQ({ items }: { items: SystemFaq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="divide-y divide-navy/[0.06] rounded-xl3 border border-navy/[0.06] bg-white">
      {items.map((item, i) => {
        const open = openIndex === i
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={open}
            >
              <span className="text-[14.5px] font-semibold text-navy">{item.question}</span>
              <ChevronDown
                size={17}
                className={`shrink-0 text-navy/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <p className="px-6 pb-5 text-[14px] leading-relaxed text-navy/55">{item.answer}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
